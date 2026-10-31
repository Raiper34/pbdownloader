import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStep } from './job-step.entity';

export enum JobStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  targetUrl: string;

  @Column({ type: 'text', default: JobStatus.IDLE })
  status: JobStatus;

  @Column({ nullable: true })
  cronExpression: string;

  @Column({ default: './downloads' })
  downloadPath: string;

  @Column({ nullable: true, type: 'text' })
  lastError: string;

  @Column({ nullable: true })
  lastRunAt: Date;

  @OneToMany(() => JobStep, (step) => step.job, {
    cascade: true,
    eager: true,
  })
  steps: JobStep[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
