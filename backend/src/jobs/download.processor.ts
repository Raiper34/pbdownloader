import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { DownloadJob, JobStatus } from './entities/download-job.entity';
import { JobLog } from './entities/job-log.entity';
import { JobsGateway } from './jobs.gateway';
import { StepType } from '../downloaders/entities/step.entity';
import { Downloader } from '../downloaders/entities/downloader.entity';

// Map: CDP downloadGuid -> jobId (pre tracking aktívnych stiahnutí)
const activeDownloads = new Map<string, number>();
// Map: CDP downloadGuid -> resolver funkcia pre čakanie na dokončenie
const downloadResolvers = new Map<string, (filename: string | null) => void>();
// Map: CDP downloadGuid -> suggestedFilename
const downloadFilenames = new Map<string, string>();
// Map: jobId -> abort callback (zatvori browser a oznaci job ako cancelled)
const abortCallbacks = new Map<number, () => void>();
// Map: downloaderId -> number of currently running jobs
const runningJobsPerDownloader = new Map<number, number>();
// Map: downloaderId -> timestamp (ms) when last job finished
const lastFinishedPerDownloader = new Map<number, number>();

export const DOWNLOAD_QUEUE = 'download';

@Processor(DOWNLOAD_QUEUE, {
  // Lock sa obnovuje každých 10s, platí 30s — dostatok pre veľké súbory
  lockDuration: 30000,
  lockRenewTime: 10000,
  // Povolíme paralelné spracovanie; per-downloader limity rieši vlastná logika
  concurrency: 10,
})
export class DownloadProcessor extends WorkerHost {
  private readonly logger = new Logger(DownloadProcessor.name);

  constructor(
    @InjectRepository(DownloadJob)
    private readonly jobRepo: Repository<DownloadJob>,
    @InjectRepository(Downloader)
    private readonly downloaderRepo: Repository<Downloader>,
    @InjectRepository(JobLog)
    private readonly jobLogRepo: Repository<JobLog>,
    private readonly gateway: JobsGateway,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ jobId: number }>): Promise<void> {
    const { jobId } = job.data;
    const downloadJob = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!downloadJob) {
      this.logger.error(`DownloadJob #${jobId} not found.`);
      return;
    }

    const downloader = await this.downloaderRepo.findOne({
      where: { id: downloadJob.downloaderId },
    });

    if (!downloader) {
      await this.failJob(downloadJob, 'Downloader not found.', undefined);
      return;
    }

    const steps = [...downloader.steps].sort((a, b) => a.order - b.order);

    const downloadsDir = this.config.get<string>('downloadsPath')!;
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;
    let cancelled = false;

    // Promise ktorý sa resolve-uje keď príde požiadavka na zrušenie
    const cancelPromise = new Promise<void>((resolve) => {
      abortCallbacks.set(jobId, () => {
        cancelled = true;
        resolve();
      });
    });

    // Čakáme na voľný slot pre tento downloader (per-downloader concurrency + delay)
    const maxConcurrent = downloader.maxConcurrentJobs ?? 1;
    const delayMs = (downloader.jobDelay ?? 0) * 1000;

    while (!cancelled) {
      const running = runningJobsPerDownloader.get(downloader.id) ?? 0;
      const lastFinished = lastFinishedPerDownloader.get(downloader.id) ?? 0;
      const timeSinceLastFinish = Date.now() - lastFinished;

      if (running < maxConcurrent && (lastFinished === 0 || timeSinceLastFinish >= delayMs)) {
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (cancelled) {
      await this.cancelJob(downloadJob);
      abortCallbacks.delete(jobId);
      this.logger.log(`Job #${jobId} cancelled while waiting for slot.`);
      return;
    }

    // Zarezervujeme slot pre tento downloader
    runningJobsPerDownloader.set(downloader.id, (runningJobsPerDownloader.get(downloader.id) ?? 0) + 1);

    await this.updateStatus(downloadJob, JobStatus.RUNNING);

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      page = await browser.newPage();

      // Set download behavior na úrovni browsera s eventsEnabled pre CDP progress eventy
      const browserCdp = await browser.target().createCDPSession();
      await browserCdp.send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadsDir,
        eventsEnabled: true,
      });

      // Počúvame CDP Browser.downloadProgress eventy a emitujeme ich cez WebSocket
      browserCdp.on('Browser.downloadProgress', (event: {
        guid: string;
        totalBytes: number;
        receivedBytes: number;
        state: 'inProgress' | 'completed' | 'canceled';
      }) => {
        const trackedJobId = activeDownloads.get(event.guid);
        if (trackedJobId !== undefined) {
          const percent = event.totalBytes > 0
            ? Math.round((event.receivedBytes / event.totalBytes) * 100)
            : null;
          this.gateway.emitJobProgress({
            jobId: trackedJobId,
            receivedBytes: event.receivedBytes,
            totalBytes: event.totalBytes,
            percent,
          });
          if (event.state === 'completed' || event.state === 'canceled') {
            activeDownloads.delete(event.guid);
            const resolve = downloadResolvers.get(event.guid);
            if (resolve) {
              downloadResolvers.delete(event.guid);
              resolve(event.state === 'completed' ? downloadFilenames.get(event.guid) ?? null : null);
              downloadFilenames.delete(event.guid);
            }
          }
        }
      });

      // Zachytíme guid pri štarte sťahovania
      browserCdp.on('Browser.downloadWillBegin', (event: {
        guid: string;
        url: string;
        suggestedFilename: string;
      }) => {
        activeDownloads.set(event.guid, jobId);
        downloadFilenames.set(event.guid, event.suggestedFilename);
        this.logger.log(`Download started: guid=${event.guid} file=${event.suggestedFilename}`);
      });

      this.logger.log(`Opening URL: ${downloadJob.url}`);
      await page.goto(downloadJob.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      let resolvedTitle: string | null = null;
      if (downloader.titleSelector) {
        try {
          await page.waitForSelector(downloader.titleSelector, { timeout: 5000 });
          // Poll until textContent is non-empty or timeout (5s)
          const pollStart = Date.now();
          while (Date.now() - pollStart < 5000) {
            resolvedTitle = await page.$eval(downloader.titleSelector, (el) => el.textContent?.trim() || null);
            if (resolvedTitle) break;
            await new Promise((r) => setTimeout(r, 100));
          }
          this.logger.log(`Job #${jobId} title from selector "${downloader.titleSelector}": "${resolvedTitle}"`);
        } catch (err) {
          this.logger.warn(`Job #${jobId} titleSelector "${downloader.titleSelector}" failed, falling back to page title: ${err}`);
        }
      }
      if (!resolvedTitle) {
        resolvedTitle = await page.title() || null;
      }
      if (resolvedTitle) {
        downloadJob.title = resolvedTitle;
        await this.jobRepo.save(downloadJob);
        this.gateway.emitJobUpdated(downloadJob);
        this.logger.log(`Job #${jobId} title: "${resolvedTitle}"`);
      }

      let downloadedFileName: string | null = null;

      let logOrder = 0;
      const pageLoadedPath = await this.captureScreenshot(page, downloadsDir, `job-${jobId}-log-0-page-loaded`);
      await this.jobLogRepo.save(this.jobLogRepo.create({
        jobId,
        order: logOrder++,
        label: 'Page loaded',
        screenshotPath: pageLoadedPath,
      }));

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const isLastStep = i === steps.length - 1;
        const currentLogOrder = logOrder++;

        this.logger.log(`Executing step #${step.order}: ${step.type}${step.selector ? ` on ${step.selector}` : ''}${step.negate ? ' [negated]' : ''}${step.optional ? ' [optional]' : ''}`);

        if (cancelled) break;

        try {
          if (step.type === StepType.CLICK) {
            await page.waitForSelector(step.selector!, { timeout: 15000 });

            if (isLastStep) {
              const downloadPromise = new Promise<string | null>((resolve) => {
                const onWillBegin = (event: { guid: string; url: string; suggestedFilename: string }) => {
                  browserCdp.off('Browser.downloadWillBegin', onWillBegin);
                  downloadResolvers.set(event.guid, resolve);
                };
                browserCdp.on('Browser.downloadWillBegin', onWillBegin);
              });

              await page.click(step.selector!);

              const downloadStartedPath = await this.captureScreenshot(page, downloadsDir, `job-${jobId}-log-${currentLogOrder}-download-started`);
              await this.jobLogRepo.save(this.jobLogRepo.create({
                jobId,
                order: currentLogOrder,
                label: 'Download started',
                stepType: step.type,
                stepSelector: step.selector,
                screenshotPath: downloadStartedPath,
              }));

              const result = await Promise.race([
                downloadPromise.then((filename) => ({ type: 'done' as const, filename })),
                cancelPromise.then(() => ({ type: 'cancelled' as const, filename: null })),
              ]);

              if (result.type === 'cancelled') {
                break;
              }

              downloadedFileName = result.filename;

              if (!downloadedFileName) {
                throw new Error('Download did not complete within the timeout period.');
              }
            } else {
              await page.click(step.selector!);
              await new Promise((r) => setTimeout(r, 1000));

              const screenshotPath = await this.captureScreenshot(page, downloadsDir, `job-${jobId}-log-${currentLogOrder}-step-${step.order}`);
              await this.jobLogRepo.save(this.jobLogRepo.create({
                jobId,
                order: currentLogOrder,
                label: `Step ${step.order}: ${step.type}`,
                stepType: step.type,
                stepSelector: step.selector,
                screenshotPath,
              }));
            }
          } else if (step.type === StepType.FILL) {
            await page.waitForSelector(step.selector!, { timeout: 15000 });
            await page.click(step.selector!, { clickCount: 3 });
            await page.type(step.selector!, step.value || '');
            await new Promise((r) => setTimeout(r, 500));

            const screenshotPath = await this.captureScreenshot(page, downloadsDir, `job-${jobId}-log-${currentLogOrder}-step-${step.order}`);
            await this.jobLogRepo.save(this.jobLogRepo.create({
              jobId,
              order: currentLogOrder,
              label: `Step ${step.order}: ${step.type}`,
              stepType: step.type,
              stepSelector: step.selector,
              stepValue: step.value,
              screenshotPath,
            }));
          } else if (step.type === StepType.WAIT) {
            const ms = parseInt(step.value || '1000', 10);
            this.logger.log(`Waiting ${ms} ms`);
            await new Promise((r) => setTimeout(r, ms));

            const screenshotPath = await this.captureScreenshot(page, downloadsDir, `job-${jobId}-log-${currentLogOrder}-step-${step.order}`);
            await this.jobLogRepo.save(this.jobLogRepo.create({
              jobId,
              order: currentLogOrder,
              label: `Step ${step.order}: ${step.type}`,
              stepType: step.type,
              stepValue: step.value,
              screenshotPath,
            }));
          } else if (step.type === StepType.WAIT_FOR_SELECTOR) {
            if (step.negate) {
              this.logger.log(`Waiting for selector "${step.selector}" to disappear`);
              await page.waitForSelector(step.selector!, { hidden: true, timeout: 15000 });
            } else {
              this.logger.log(`Waiting for selector "${step.selector}" to appear`);
              await page.waitForSelector(step.selector!, { visible: true, timeout: 15000 });
            }

            const screenshotPath = await this.captureScreenshot(page, downloadsDir, `job-${jobId}-log-${currentLogOrder}-step-${step.order}`);
            await this.jobLogRepo.save(this.jobLogRepo.create({
              jobId,
              order: currentLogOrder,
              label: `Step ${step.order}: ${step.type}`,
              stepType: step.type,
              stepSelector: step.selector,
              screenshotPath,
            }));
          }
        } catch (stepErr: any) {
          const screenshotPath = await this.captureScreenshot(page, downloadsDir, `job-${jobId}-log-${currentLogOrder}-step-${step.order}-failed`);
          await this.jobLogRepo.save(this.jobLogRepo.create({
            jobId,
            order: currentLogOrder,
            label: `Step ${step.order}: ${step.type} (failed)`,
            stepType: step.type,
            stepSelector: step.selector,
            stepValue: step.value,
            screenshotPath,
          }));

          if (step.optional) {
            this.logger.warn(`Optional step #${step.order} (${step.type}) failed, continuing: ${stepErr.message}`);
          } else {
            throw stepErr;
          }
        }

        if (cancelled) break;
      }

      if (cancelled) {
        await this.cancelJob(downloadJob);
        this.logger.log(`Job #${jobId} cancelled.`);
      } else if (downloadedFileName) {
        downloadJob.filePath = path.join(downloadsDir, downloadedFileName);
        downloadJob.fileName = downloadedFileName;
        await this.updateStatus(downloadJob, JobStatus.DONE);
        this.logger.log(`Job #${jobId} done. File: ${downloadedFileName}`);
      } else {
        await this.updateStatus(downloadJob, JobStatus.DONE);
      }
    } catch (err: any) {
      if (cancelled) {
        await this.cancelJob(downloadJob);
        this.logger.log(`Job #${jobId} cancelled.`);
      } else {
        this.logger.error(`Job #${jobId} failed: ${err.message}`);
        await this.failJob(downloadJob, err.message, page ?? undefined);
      }
    } finally {
      const runningCount = runningJobsPerDownloader.get(downloader.id) ?? 1;
      if (runningCount <= 1) {
        runningJobsPerDownloader.delete(downloader.id);
      } else {
        runningJobsPerDownloader.set(downloader.id, runningCount - 1);
      }
      lastFinishedPerDownloader.set(downloader.id, Date.now());

      abortCallbacks.delete(jobId);
      if (browser) await browser.close();
    }
  }

  /** Zavolá abort callback pre bežiaci job. Vracia true ak bol callback nájdený. */
  abortJob(jobId: number): boolean {
    const abort = abortCallbacks.get(jobId);
    if (abort) {
      abort();
      return true;
    }
    return false;
  }

  private async captureScreenshot(page: puppeteer.Page, downloadsDir: string, name: string): Promise<string | undefined> {
    try {
      const screenshotPath = path.join(downloadsDir, `${name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      return screenshotPath;
    } catch (ssErr: any) {
      this.logger.warn(`Failed to capture screenshot ${name}: ${ssErr.message}`);
      return undefined;
    }
  }

  private async updateStatus(job: DownloadJob, status: JobStatus): Promise<void> {
    job.status = status;
    await this.jobRepo.save(job);
    this.gateway.emitJobUpdated(job);
  }

  private async failJob(
    job: DownloadJob,
    errorMessage: string,
    page?: puppeteer.Page,
  ): Promise<void> {
    job.status = JobStatus.FAILED;
    job.errorMessage = errorMessage;

    if (page) {
      const downloadsDir = this.config.get<string>('downloadsPath')!;
      const baseName = `job-${job.id}-error-${Date.now()}`;

      try {
        const screenshotPath = path.join(downloadsDir, `${baseName}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        job.screenshotPath = screenshotPath;
        this.logger.log(`Job #${job.id} error screenshot saved: ${screenshotPath}`);
      } catch (ssErr: any) {
        this.logger.warn(`Job #${job.id} failed to save screenshot: ${ssErr.message}`);
      }

      try {
        const htmlPath = path.join(downloadsDir, `${baseName}.html`);
        const html = await page.content();
        fs.writeFileSync(htmlPath, html, 'utf8');
        job.htmlPath = htmlPath;
        this.logger.log(`Job #${job.id} error HTML saved: ${htmlPath}`);
      } catch (htmlErr: any) {
        this.logger.warn(`Job #${job.id} failed to save HTML: ${htmlErr.message}`);
      }
    }

    await this.jobRepo.save(job);
    this.gateway.emitJobUpdated(job);
  }

  private async cancelJob(job: DownloadJob): Promise<void> {
    job.status = JobStatus.CANCELLED;
    await this.jobRepo.save(job);
    this.gateway.emitJobUpdated(job);
  }
}
