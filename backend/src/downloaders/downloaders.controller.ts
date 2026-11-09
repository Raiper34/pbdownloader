import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { DownloadersService } from './downloaders.service';
import { CreateDownloaderDto } from './dto/create-downloader.dto';
import { UpdateDownloaderDto } from './dto/update-downloader.dto';

@Controller('api/downloaders')
export class DownloadersController {
  constructor(private readonly service: DownloadersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('import')
  @HttpCode(201)
  importOne(@Body() data: object) {
    return this.service.importOne(data);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/export')
  exportOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.exportOne(id);
  }

  @Post()
  create(@Body() dto: CreateDownloaderDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDownloaderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
