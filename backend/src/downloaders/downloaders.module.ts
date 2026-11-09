import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Downloader } from './entities/downloader.entity';
import { Step } from './entities/step.entity';
import { DownloadersService } from './downloaders.service';
import { DownloadersController } from './downloaders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Downloader, Step])],
  controllers: [DownloadersController],
  providers: [DownloadersService],
  exports: [DownloadersService],
})
export class DownloadersModule {}
