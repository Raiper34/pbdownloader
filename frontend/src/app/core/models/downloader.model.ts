export type StepType = 'click' | 'fill' | 'wait' | 'waitForSelector';

export interface Step {
  id?: number;
  order: number;
  type: StepType;
  selector?: string;
  value?: string;
  negate?: boolean;
  optional?: boolean;
  downloaderId?: number;
}

export interface Downloader {
  id: number;
  name: string;
  urlPattern: string;
  description?: string;
  titleSelector?: string;
  maxConcurrentJobs: number;
  jobDelay: number;
  createdAt: string;
  updatedAt: string;
  steps: Step[];
}

export interface CreateDownloaderRequest {
  name: string;
  urlPattern: string;
  description?: string;
  titleSelector?: string;
  maxConcurrentJobs?: number;
  jobDelay?: number;
  steps: Omit<Step, 'id' | 'downloaderId'>[];
}
