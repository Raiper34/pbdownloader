import { Downloader } from './downloader.model';

export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

export interface DownloadJob {
  id: number;
  url: string;
  downloaderId?: number;
  status: JobStatus;
  title?: string;
  filePath?: string;
  fileName?: string;
  errorMessage?: string;
  screenshotPath?: string;
  htmlPath?: string;
  createdAt: string;
  updatedAt: string;
  downloader?: Downloader;
}

export interface CreateJobRequest {
  url: string;
  downloaderId?: number;
}

export interface JobProgress {
  jobId: number;
  receivedBytes: number;
  totalBytes: number;
  percent: number | null;
  speedBps?: number;  // bytes/s, computed on frontend
  _ts?: number;       // internal: timestamp when this event was received (ms)
}
