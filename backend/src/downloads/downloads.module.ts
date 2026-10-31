import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Download } from '../database/entities/download.entity';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Download])],
  controllers: [DownloadsController],
  providers: [DownloadsService],
})
export class DownloadsModule {}
