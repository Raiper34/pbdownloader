import { WorkerHost } from '@nestjs/bullmq';
import { Job as BullJob } from 'bullmq';
import { Repository } from 'typeorm';
import { Download } from '../database/entities/download.entity';
import { Job } from '../database/entities/job.entity';
import { ProgressGateway } from '../gateway/progress.gateway';
import { JobsService } from './jobs.service';
export declare class JobsProcessor extends WorkerHost {
    private readonly jobsService;
    private readonly progressGateway;
    private readonly jobRepository;
    private readonly downloadRepository;
    private readonly logger;
    constructor(jobsService: JobsService, progressGateway: ProgressGateway, jobRepository: Repository<Job>, downloadRepository: Repository<Download>);
    process(bullJob: BullJob<{
        jobId: number;
    }>): Promise<void>;
    private executeStep;
    private waitForDownloads;
}
