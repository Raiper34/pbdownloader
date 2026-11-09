import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('job_logs')
export class JobLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  jobId: number;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'varchar', nullable: true })
  stepType?: string;

  @Column({ type: 'varchar', nullable: true })
  stepSelector?: string;

  @Column({ type: 'varchar', nullable: true })
  stepValue?: string;

  @Column({ type: 'varchar', nullable: true })
  screenshotPath?: string;

  @CreateDateColumn()
  createdAt: Date;
}
