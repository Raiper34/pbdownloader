import { Job } from './job.model';

export interface Download {
  id: number;
  jobId: number;
  job?: Job;
  filename: string;
  filePath: string;
  mimeType?: string;
  fileSize: number;
  createdAt: string;
}
