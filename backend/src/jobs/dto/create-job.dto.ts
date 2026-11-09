import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsInt()
  @IsOptional()
  downloaderId?: number;
}
