import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Job } from './job.entity';

@Entity('downloads')
export class Download {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: number;

  @ManyToOne(() => Job, { onDelete: 'SET NULL', nullable: true })
  job: Job;

  @Column()
  filename: string;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;
}
