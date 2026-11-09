import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Downloader } from './downloader.entity';

export enum StepType {
  CLICK = 'click',
  FILL = 'fill',
  WAIT = 'wait',
  WAIT_FOR_SELECTOR = 'waitForSelector',
}

@Entity('steps')
export class Step {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'varchar', enum: StepType })
  type: StepType;

  @Column({ type: 'varchar', nullable: true })
  selector?: string;

  @Column({ type: 'varchar', nullable: true })
  value?: string;

  @Column({ type: 'boolean', default: false })
  negate: boolean;

  @Column({ type: 'boolean', default: false })
  optional: boolean;

  @Column({ type: 'int' })
  downloaderId: number;

  @ManyToOne(() => Downloader, (downloader) => downloader.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'downloaderId' })
  downloader: Downloader;
}
