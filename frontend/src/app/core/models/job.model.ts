export enum StepType {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  FILL = 'fill',
  WAIT = 'wait',
  DOWNLOAD = 'download',
  SCREENSHOT = 'screenshot',
}

export enum JobStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface JobStep {
  id?: number;
  jobId?: number;
  order: number;
  type: StepType;
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  description: string;
}

export interface Job {
  id?: number;
  name: string;
  description?: string;
  targetUrl: string;
  status: JobStatus;
  cronExpression?: string;
  downloadPath: string;
  lastError?: string;
  lastRunAt?: string;
  steps: JobStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgressEvent {
  jobId: number;
  stepIndex: number;
  stepDescription: string;
  status: 'running' | 'success' | 'error';
  message?: string;
  totalSteps: number;
}

export interface JobStatusEvent {
  jobId: number;
  status: JobStatus;
  error?: string;
}
