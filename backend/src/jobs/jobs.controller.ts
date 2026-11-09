import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.service.create(dto);
  }

  @Post(':id/retry')
  retry(@Param('id', ParseIntPipe) id: number) {
    return this.service.retry(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const job = await this.service.findOne(id);
    if (!job.filePath || !fs.existsSync(job.filePath)) {
      return res.status(404).json({ message: 'File not found.' });
    }
    const fileName = job.fileName || path.basename(job.filePath);
    res.download(job.filePath, fileName);
  }

  @Get(':id/screenshot')
  async getScreenshot(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const job = await this.service.findOne(id);
    if (!job.screenshotPath || !fs.existsSync(job.screenshotPath)) {
      return res.status(404).json({ message: 'Screenshot not found.' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(job.screenshotPath);
  }

  @Get(':id/html')
  async getHtml(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const job = await this.service.findOne(id);
    if (!job.htmlPath || !fs.existsSync(job.htmlPath)) {
      return res.status(404).json({ message: 'HTML snapshot not found.' });
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(job.htmlPath);
  }

  @Get(':id/logs')
  getLogs(@Param('id', ParseIntPipe) id: number) {
    return this.service.findLogs(id);
  }

  @Get(':id/logs/:logId/screenshot')
  async getLogScreenshot(
    @Param('id', ParseIntPipe) id: number,
    @Param('logId', ParseIntPipe) logId: number,
    @Res() res: Response,
  ) {
    const log = await this.service.findLog(id, logId);
    if (!log?.screenshotPath || !fs.existsSync(log.screenshotPath)) {
      return res.status(404).json({ message: 'Screenshot not found.' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(log.screenshotPath);
  }
}
