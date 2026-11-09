import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStepDto } from './create-step.dto';

export class CreateDownloaderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  urlPattern: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  titleSelector?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxConcurrentJobs?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  jobDelay?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps: CreateStepDto[];
}
