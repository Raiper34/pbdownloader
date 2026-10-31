import { Job } from './job.entity';
export declare enum StepType {
    NAVIGATE = "navigate",
    CLICK = "click",
    FILL = "fill",
    WAIT = "wait",
    DOWNLOAD = "download",
    SCREENSHOT = "screenshot"
}
export declare class JobStep {
    id: number;
    jobId: number;
    job: Job;
    order: number;
    type: StepType;
    selector: string;
    value: string;
    url: string;
    timeout: number;
    description: string;
}
