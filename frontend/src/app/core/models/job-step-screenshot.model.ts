export interface JobStepScreenshot {
  id: number;
  jobId: number;
  stepOrder: number;
  stepType: string;
  stepSelector?: string;
  stepValue?: string;
  negate: boolean;
  optional: boolean;
  beforeScreenshotPath?: string;
  afterScreenshotPath?: string;
  createdAt: string;
}
