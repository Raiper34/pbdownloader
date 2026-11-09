export interface JobLog {
  id: number;
  jobId: number;
  order: number;
  label: string;
  stepType?: string;
  stepSelector?: string;
  stepValue?: string;
  screenshotPath?: string;
  createdAt: string;
}
