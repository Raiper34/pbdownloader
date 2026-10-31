import { Job } from './job.entity';
export declare class Download {
    id: number;
    jobId: number;
    job: Job;
    filename: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
}
