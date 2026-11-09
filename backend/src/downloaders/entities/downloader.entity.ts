import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Step } from './step.entity';

@Entity('downloaders')
export class Downloader {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  urlPattern: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  titleSelector?: string;

  @Column({ type: 'integer', default: 1 })
  maxConcurrentJobs: number;

  @Column({ type: 'integer', default: 0 })
  jobDelay: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Step, (step) => step.downloader, { cascade: true, eager: true })
  steps: Step[];
}
