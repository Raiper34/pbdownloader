import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../database/entities/job.entity';
import { JobStep } from '../database/entities/job-step.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
export declare class JobsService {
    private readonly jobRepository;
    private readonly jobStepRepository;
    private readonly jobQueue;
    constructor(jobRepository: Repository<Job>, jobStepRepository: Repository<JobStep>, jobQueue: Queue);
    findAll(): Promise<Job[]>;
    findOne(id: number): Promise<Job>;
    create(dto: CreateJobDto): Promise<Job>;
    update(id: number, dto: UpdateJobDto): Promise<Job>;
    remove(id: number): Promise<void>;
    enqueue(id: number): Promise<Job>;
    updateStatus(id: number, status: JobStatus, error?: string): Promise<void>;
}
