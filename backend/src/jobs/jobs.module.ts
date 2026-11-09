import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { DownloadJob } from './entities/download-job.entity';
import { JobLog } from './entities/job-log.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsGateway } from './jobs.gateway';
import { DownloadProcessor, DOWNLOAD_QUEUE } from './download.processor';
import { DownloadersModule } from '../downloaders/downloaders.module';
import { Downloader } from '../downloaders/entities/downloader.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DownloadJob, Downloader, JobLog]),
    BullModule.registerQueue({ name: DOWNLOAD_QUEUE }),
    DownloadersModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsGateway, DownloadProcessor],
})
export class JobsModule {}
