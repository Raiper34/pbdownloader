import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StepType } from '../../database/entities/job-step.entity';

export class CreateJobStepDto {
  @IsNumber()
  order: number;

  @IsEnum(StepType)
  type: StepType;

  @IsOptional()
  @IsString()
  selector?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsNumber()
  timeout?: number;

  @IsString()
  description: string;
}

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  targetUrl: string;

  @IsOptional()
  @IsString()
  cronExpression?: string;

  @IsOptional()
  @IsString()
  downloadPath?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJobStepDto)
  steps: CreateJobStepDto[];
}
