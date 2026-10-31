import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get()
  findAll() {
    return this.downloadsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.downloadsService.findOne(id);
  }

  @Get(':id/file')
  async serveFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const download = await this.downloadsService.findOne(id);
    const filePath = path.resolve(download.filePath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }
    res.download(filePath, download.filename);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.downloadsService.remove(id);
  }
}
