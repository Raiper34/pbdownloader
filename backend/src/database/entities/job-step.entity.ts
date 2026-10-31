import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Job } from './job.entity';

export enum StepType {
  NAVIGATE = 'navigate',
  CLICK = 'click',
  FILL = 'fill',
  WAIT = 'wait',
  DOWNLOAD = 'download',
  SCREENSHOT = 'screenshot',
}

@Entity('job_steps')
export class JobStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: number;

  @ManyToOne(() => Job, (job) => job.steps, { onDelete: 'CASCADE' })
  job: Job;

  @Column()
  order: number;

  @Column({ type: 'text' })
  type: StepType;

  @Column({ nullable: true })
  selector: string;

  @Column({ nullable: true, type: 'text' })
  value: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  timeout: number;

  @Column({ default: '' })
  description: string;
}
