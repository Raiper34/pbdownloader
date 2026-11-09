import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Downloader } from './entities/downloader.entity';
import { Step } from './entities/step.entity';
import { CreateDownloaderDto } from './dto/create-downloader.dto';
import { UpdateDownloaderDto } from './dto/update-downloader.dto';

@Injectable()
export class DownloadersService {
  constructor(
    @InjectRepository(Downloader)
    private readonly downloaderRepo: Repository<Downloader>,
    @InjectRepository(Step)
    private readonly stepRepo: Repository<Step>,
  ) {}

  async findAll(): Promise<Downloader[]> {
    return this.downloaderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Downloader> {
    const downloader = await this.downloaderRepo.findOne({ where: { id } });
    if (!downloader) throw new NotFoundException(`Downloader #${id} not found.`);
    return downloader;
  }

  async create(dto: CreateDownloaderDto): Promise<Downloader> {
    const downloader = this.downloaderRepo.create({
      name: dto.name,
      urlPattern: dto.urlPattern,
      description: dto.description,
      titleSelector: dto.titleSelector,
      maxConcurrentJobs: dto.maxConcurrentJobs ?? 1,
      jobDelay: dto.jobDelay ?? 0,
      steps: dto.steps.map((s) =>
        this.stepRepo.create({
          order: s.order,
          type: s.type,
          selector: s.selector,
          value: s.value,
        }),
      ),
    });
    return this.downloaderRepo.save(downloader);
  }

  async update(id: number, dto: UpdateDownloaderDto): Promise<Downloader> {
    const downloader = await this.findOne(id);

    if (dto.name !== undefined) downloader.name = dto.name;
    if (dto.urlPattern !== undefined) downloader.urlPattern = dto.urlPattern;
    if (dto.description !== undefined) downloader.description = dto.description;
    if (dto.titleSelector !== undefined) downloader.titleSelector = dto.titleSelector;
    if (dto.maxConcurrentJobs !== undefined) downloader.maxConcurrentJobs = dto.maxConcurrentJobs;
    if (dto.jobDelay !== undefined) downloader.jobDelay = dto.jobDelay;

    if (dto.steps !== undefined) {
      await this.stepRepo.delete({ downloaderId: id });
      downloader.steps = dto.steps.map((s) =>
        this.stepRepo.create({
          order: s.order,
          type: s.type,
          selector: s.selector,
          value: s.value,
        }),
      );
    }

    return this.downloaderRepo.save(downloader);
  }

  async remove(id: number): Promise<void> {
    const downloader = await this.findOne(id);
    await this.downloaderRepo.remove(downloader);
  }

  async exportOne(id: number): Promise<object> {
    const d = await this.findOne(id);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      name: d.name,
      urlPattern: d.urlPattern,
      description: d.description,
      titleSelector: d.titleSelector,
      maxConcurrentJobs: d.maxConcurrentJobs,
      jobDelay: d.jobDelay,
      steps: d.steps
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
          order: s.order,
          type: s.type,
          selector: s.selector,
          value: s.value,
          negate: s.negate,
          optional: s.optional,
        })),
    };
  }

  async importOne(data: object): Promise<Downloader> {
    const payload = data as CreateDownloaderDto & { version?: number; exportedAt?: string };
    if (!payload.name || !payload.urlPattern || !Array.isArray(payload.steps)) {
      throw new Error('Invalid import format: missing required fields (name, urlPattern, steps).');
    }
    return this.create({
      name: payload.name,
      urlPattern: payload.urlPattern,
      description: payload.description,
      titleSelector: (payload as any).titleSelector,
      maxConcurrentJobs: (payload as any).maxConcurrentJobs,
      jobDelay: (payload as any).jobDelay,
      steps: payload.steps,
    });
  }

  async matchUrl(url: string): Promise<Downloader | null> {
    const all = await this.findAll();
    for (const d of all) {
      try {
        const regex = new RegExp(d.urlPattern);
        if (regex.test(url)) return d;
      } catch {
        // invalid regex, skip
      }
    }
    return null;
  }
}
