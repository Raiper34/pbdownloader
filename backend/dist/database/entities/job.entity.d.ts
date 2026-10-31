import { JobStep } from './job-step.entity';
export declare enum JobStatus {
    IDLE = "idle",
    QUEUED = "queued",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class Job {
    id: number;
    name: string;
    description: string;
    targetUrl: string;
    status: JobStatus;
    cronExpression: string;
    downloadPath: string;
    lastError: string;
    lastRunAt: Date;
    steps: JobStep[];
    createdAt: Date;
    updatedAt: Date;
}
