import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Downloader } from '../../downloaders/entities/downloader.entity';

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('download_jobs')
export class DownloadJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'int', nullable: true })
  downloaderId?: number;

  @Column({ type: 'varchar', default: JobStatus.PENDING })
  status: JobStatus;

  @Column({ type: 'varchar', nullable: true })
  title?: string;

  @Column({ type: 'varchar', nullable: true })
  filePath?: string;

  @Column({ type: 'varchar', nullable: true })
  fileName?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'varchar', nullable: true })
  screenshotPath?: string;

  @Column({ type: 'varchar', nullable: true })
  htmlPath?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Downloader, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'downloaderId' })
  downloader?: Downloader;
}
