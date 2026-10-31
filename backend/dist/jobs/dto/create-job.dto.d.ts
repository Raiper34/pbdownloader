import { StepType } from '../../database/entities/job-step.entity';
export declare class CreateJobStepDto {
    order: number;
    type: StepType;
    selector?: string;
    value?: string;
    url?: string;
    timeout?: number;
    description: string;
}
export declare class CreateJobDto {
    name: string;
    description?: string;
    targetUrl: string;
    cronExpression?: string;
    downloadPath?: string;
    steps: CreateJobStepDto[];
}
