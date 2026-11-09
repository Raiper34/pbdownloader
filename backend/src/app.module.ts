import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DownloadersModule } from './downloaders/downloaders.module';
import { JobsModule } from './jobs/jobs.module';
import { Downloader } from './downloaders/entities/downloader.entity';
import { Step } from './downloaders/entities/step.entity';
import { DownloadJob } from './jobs/entities/download-job.entity';
import { JobLog } from './jobs/entities/job-log.entity';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('dbPath')!,
        entities: [Downloader, Step, DownloadJob, JobLog],
        synchronize: true,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: config.get<string>('downloadsPath')!,
          serveRoot: '/api/files',
          serveStaticOptions: { index: false },
        },
      ],
    }),
    DownloadersModule,
    JobsModule,
  ],
})
export class AppModule {}
