import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('job_step_screenshots')
export class JobStepScreenshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  jobId: number;

  @Column({ type: 'int' })
  stepOrder: number;

  @Column({ type: 'varchar' })
  stepType: string;

  @Column({ type: 'varchar', nullable: true })
  stepSelector?: string;

  @Column({ type: 'varchar', nullable: true })
  stepValue?: string;

  @Column({ type: 'boolean', default: false })
  negate: boolean;

  @Column({ type: 'boolean', default: false })
  optional: boolean;

  @Column({ type: 'varchar', nullable: true })
  beforeScreenshotPath?: string;

  @Column({ type: 'varchar', nullable: true })
  afterScreenshotPath?: string;

  @CreateDateColumn()
  createdAt: Date;
}
