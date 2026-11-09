import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import { DownloadJob, JobStatus } from './entities/download-job.entity';
import { JobLog } from './entities/job-log.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsGateway } from './jobs.gateway';
import { DownloadersService } from '../downloaders/downloaders.service';
import { DOWNLOAD_QUEUE, DownloadProcessor } from './download.processor';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(DownloadJob)
    private readonly jobRepo: Repository<DownloadJob>,
    @InjectRepository(JobLog)
    private readonly jobLogRepo: Repository<JobLog>,
    @InjectQueue(DOWNLOAD_QUEUE)
    private readonly downloadQueue: Queue,
    private readonly gateway: JobsGateway,
    private readonly downloadersService: DownloadersService,
    private readonly downloadProcessor: DownloadProcessor,
  ) {}

  async findAll(): Promise<DownloadJob[]> {
    return this.jobRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<DownloadJob> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job #${id} not found.`);
    return job;
  }

  async create(dto: CreateJobDto): Promise<DownloadJob> {
    let downloaderId = dto.downloaderId;

    if (!downloaderId) {
      const matched = await this.downloadersService.matchUrl(dto.url);
      if (matched) {
        downloaderId = matched.id;
      }
    }

    const job = this.jobRepo.create({
      url: dto.url,
      downloaderId,
      status: JobStatus.PENDING,
    });

    const saved = await this.jobRepo.save(job);
    this.gateway.emitJobCreated(saved);

    await this.downloadQueue.add('process', { jobId: saved.id });

    return saved;
  }

  async retry(id: number): Promise<DownloadJob> {
    const job = await this.findOne(id);

    const logs = await this.jobLogRepo.find({ where: { jobId: id } });
    for (const log of logs) {
      this.deleteFile(log.screenshotPath);
    }
    await this.jobLogRepo.delete({ jobId: id });

    this.deleteFile(job.screenshotPath);
    this.deleteFile(job.htmlPath);

    job.status = JobStatus.PENDING;
    job.errorMessage = undefined;
    job.filePath = undefined;
    job.fileName = undefined;
    job.screenshotPath = undefined;
    job.htmlPath = undefined;

    const saved = await this.jobRepo.save(job);
    this.gateway.emitJobUpdated(saved);

    await this.downloadQueue.add('process', { jobId: saved.id });

    return saved;
  }

  async cancel(id: number): Promise<DownloadJob> {
    const job = await this.findOne(id);

    if (job.status !== JobStatus.RUNNING && job.status !== JobStatus.PENDING) {
      throw new Error(`Job #${id} cannot be cancelled (status: ${job.status}).`);
    }

    if (job.status === JobStatus.PENDING) {
      job.status = JobStatus.CANCELLED;
      const saved = await this.jobRepo.save(job);
      this.gateway.emitJobUpdated(saved);
      return saved;
    }

    const aborted = this.downloadProcessor.abortJob(id);
    if (!aborted) {
      job.status = JobStatus.CANCELLED;
      const saved = await this.jobRepo.save(job);
      this.gateway.emitJobUpdated(saved);
      return saved;
    }

    return job;
  }

  async remove(id: number): Promise<void> {
    const job = await this.findOne(id);

    const logs = await this.jobLogRepo.find({ where: { jobId: id } });
    for (const log of logs) {
      this.deleteFile(log.screenshotPath);
    }
    await this.jobLogRepo.delete({ jobId: id });

    this.deleteFile(job.screenshotPath);
    this.deleteFile(job.htmlPath);
    this.deleteFile(job.filePath);

    await this.jobRepo.remove(job);
  }

  private deleteFile(filePath: string | undefined | null): void {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
      }
    }
  }

  async findLogs(jobId: number): Promise<JobLog[]> {
    await this.findOne(jobId);
    return this.jobLogRepo.find({ where: { jobId }, order: { order: 'ASC' } });
  }

  async findLog(jobId: number, logId: number): Promise<JobLog | null> {
    return this.jobLogRepo.findOne({ where: { id: logId, jobId } });
  }
}
