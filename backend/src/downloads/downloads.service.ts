import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Download } from '../database/entities/download.entity';

@Injectable()
export class DownloadsService {
  constructor(
    @InjectRepository(Download)
    private readonly downloadRepository: Repository<Download>,
  ) {}

  async findAll(): Promise<Download[]> {
    return this.downloadRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['job'],
    });
  }

  async findOne(id: number): Promise<Download> {
    const download = await this.downloadRepository.findOne({
      where: { id },
      relations: ['job'],
    });
    if (!download) throw new NotFoundException(`Download #${id} not found`);
    return download;
  }

  async remove(id: number): Promise<void> {
    const download = await this.findOne(id);
    await this.downloadRepository.remove(download);
  }
}
