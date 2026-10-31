import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../database/entities/job.entity';
import { JobStep } from '../database/entities/job-step.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobStep)
    private readonly jobStepRepository: Repository<JobStep>,
    @InjectQueue('jobs')
    private readonly jobQueue: Queue,
  ) {}

  async findAll(): Promise<Job[]> {
    return this.jobRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['steps'],
    });
    if (!job) throw new NotFoundException(`Job #${id} not found`);
    return job;
  }

  async create(dto: CreateJobDto): Promise<Job> {
    const job = this.jobRepository.create({
      ...dto,
      status: JobStatus.IDLE,
      downloadPath: dto.downloadPath ?? './downloads',
    });
    return this.jobRepository.save(job);
  }

  async update(id: number, dto: UpdateJobDto): Promise<Job> {
    const job = await this.findOne(id);
    const { steps, ...jobFields } = dto;
    Object.assign(job, jobFields);
    await this.jobRepository.save(job);

    if (steps !== undefined) {
      await this.jobStepRepository.delete({ jobId: id });
      const newSteps = steps.map((stepDto) =>
        this.jobStepRepository.create({ ...stepDto, jobId: id }),
      );
      await this.jobStepRepository.save(newSteps);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const job = await this.findOne(id);
    await this.jobRepository.remove(job);
  }

  async enqueue(id: number): Promise<Job> {
    const job = await this.findOne(id);
    if (job.status === JobStatus.RUNNING || job.status === JobStatus.QUEUED) {
      throw new Error(`Job #${id} is already running or queued`);
    }
    job.status = JobStatus.QUEUED;
    await this.jobRepository.save(job);
    await this.jobQueue.add('run-job', { jobId: id }, { jobId: `job-${id}-${Date.now()}` });
    return job;
  }

  async updateStatus(id: number, status: JobStatus, error?: string): Promise<void> {
    const update: Partial<Job> = { status };
    if (error) update.lastError = error;
    if (status === JobStatus.RUNNING) update.lastRunAt = new Date();
    await this.jobRepository.update(id, update);
  }
}
