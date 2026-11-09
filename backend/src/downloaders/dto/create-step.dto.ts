import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { StepType } from '../entities/step.entity';

export class CreateStepDto {
  @IsInt()
  @Min(0)
  order: number;

  @IsEnum(StepType)
  type: StepType;

  @IsString()
  @IsOptional()
  selector?: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsBoolean()
  @IsOptional()
  negate?: boolean;

  @IsBoolean()
  @IsOptional()
  optional?: boolean;
}
