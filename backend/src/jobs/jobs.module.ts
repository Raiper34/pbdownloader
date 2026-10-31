import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Download } from '../database/entities/download.entity';
import { Job } from '../database/entities/job.entity';
import { JobStep } from '../database/entities/job-step.entity';
import { ProgressGateway } from '../gateway/progress.gateway';
import { JobsController } from './jobs.controller';
import { JobsProcessor } from './jobs.processor';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobStep, Download]),
    BullModule.registerQueue({ name: 'jobs' }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor, ProgressGateway],
  exports: [JobsService],
})
export class JobsModule {}
