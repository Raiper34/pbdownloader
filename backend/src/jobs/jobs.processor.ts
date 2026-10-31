import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job as BullJob } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Repository } from 'typeorm';
import { Download } from '../database/entities/download.entity';
import { JobStep, StepType } from '../database/entities/job-step.entity';
import { Job, JobStatus } from '../database/entities/job.entity';
import { ProgressGateway } from '../gateway/progress.gateway';
import { JobsService } from './jobs.service';

@Processor('jobs')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly progressGateway: ProgressGateway,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Download)
    private readonly downloadRepository: Repository<Download>,
  ) {
    super();
  }

  async process(bullJob: BullJob<{ jobId: number }>): Promise<void> {
    const { jobId } = bullJob.data;
    const job = await this.jobsService.findOne(jobId);

    this.logger.log(`Starting job #${jobId}: ${job.name}`);
    await this.jobsService.updateStatus(jobId, JobStatus.RUNNING);
    this.progressGateway.emitJobStatus({ jobId, status: JobStatus.RUNNING });

    const downloadDir = path.resolve(job.downloadPath);
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    let browser: Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set download behavior
      const cdpSession = await page.createCDPSession();
      await cdpSession.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadDir,
      });

      // Track downloaded files before
      const filesBefore = fs.existsSync(downloadDir)
        ? new Set(fs.readdirSync(downloadDir))
        : new Set<string>();

      const sortedSteps = [...job.steps].sort((a, b) => a.order - b.order);

      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];

        this.progressGateway.emitJobProgress({
          jobId,
          stepIndex: i,
          stepDescription: step.description || `${step.type} step`,
          status: 'running',
          totalSteps: sortedSteps.length,
        });

        try {
          await this.executeStep(page, step, downloadDir);

          this.progressGateway.emitJobProgress({
            jobId,
            stepIndex: i,
            stepDescription: step.description || `${step.type} step`,
            status: 'success',
            totalSteps: sortedSteps.length,
          });
        } catch (stepError) {
          const msg = stepError instanceof Error ? stepError.message : String(stepError);
          this.progressGateway.emitJobProgress({
            jobId,
            stepIndex: i,
            stepDescription: step.description || `${step.type} step`,
            status: 'error',
            message: msg,
            totalSteps: sortedSteps.length,
          });
          throw stepError;
        }
      }

      // Wait for all pending downloads to finish
      await this.waitForDownloads(downloadDir, 60000);

      // Register new downloaded files
      if (fs.existsSync(downloadDir)) {
        const filesAfter = new Set(fs.readdirSync(downloadDir));
        for (const file of filesAfter) {
          if (!filesBefore.has(file)) {
            const filePath = path.join(downloadDir, file);
            const stat = fs.statSync(filePath);
            await this.downloadRepository.save(
              this.downloadRepository.create({
                jobId,
                filename: file,
                filePath,
                fileSize: stat.size,
              }),
            );
            this.logger.log(`Registered download: ${file}`);
          }
        }
      }

      await this.jobsService.updateStatus(jobId, JobStatus.COMPLETED);
      this.progressGateway.emitJobStatus({ jobId, status: JobStatus.COMPLETED });
      this.logger.log(`Job #${jobId} completed`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job #${jobId} failed: ${msg}`);
      await this.jobsService.updateStatus(jobId, JobStatus.FAILED, msg);
      this.progressGateway.emitJobStatus({ jobId, status: JobStatus.FAILED, error: msg });
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  private async executeStep(page: Page, step: JobStep, downloadDir: string): Promise<void> {
    const timeout = step.timeout ?? 30000;

    switch (step.type) {
      case StepType.NAVIGATE:
        await page.goto(step.url!, { waitUntil: 'networkidle2', timeout });
        break;

      case StepType.CLICK:
        await page.waitForSelector(step.selector!, { timeout });
        await page.click(step.selector!);
        break;

      case StepType.FILL:
        await page.waitForSelector(step.selector!, { timeout });
        await page.click(step.selector!, { clickCount: 3 });
        await page.type(step.selector!, step.value ?? '');
        break;

      case StepType.WAIT:
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout });
        } else {
          await new Promise((r) => setTimeout(r, timeout));
        }
        break;

      case StepType.DOWNLOAD: {
        const downloadPromise = new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (fs.existsSync(downloadDir)) {
              const files = fs.readdirSync(downloadDir).filter((f) => !f.endsWith('.crdownload'));
              if (files.length > 0) {
                clearInterval(interval);
                resolve();
              }
            }
          }, 500);
          setTimeout(() => {
            clearInterval(interval);
            resolve();
          }, timeout);
        });
        await page.waitForSelector(step.selector!, { timeout });
        await page.click(step.selector!);
        await downloadPromise;
        break;
      }

      case StepType.SCREENSHOT: {
        const screenshotPath = path.join(downloadDir, `screenshot-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        break;
      }

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private waitForDownloads(downloadDir: string, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!fs.existsSync(downloadDir)) {
          clearInterval(interval);
          resolve();
          return;
        }
        const pending = fs.readdirSync(downloadDir).filter((f) => f.endsWith('.crdownload'));
        if (pending.length === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 500);
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, timeout);
    });
  }
}
