import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { Job, JobStatus } from '../../../core/models/job.model';
import * as JobsActions from '../../../store/jobs/jobs.actions';
import { selectAllJobs, selectJobsLoading } from '../../../store/jobs/jobs.selectors';

@Component({
  selector: 'app-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  standalone: false,
})
export class JobsListComponent implements OnInit {
  jobs$!: Observable<Job[]>;
  loading$!: Observable<boolean>;

  constructor(
    private store: Store,
    private router: Router,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.jobs$ = this.store.select(selectAllJobs);
    this.loading$ = this.store.select(selectJobsLoading);
    this.store.dispatch(JobsActions.loadJobs());
  }

  createJob() {
    this.router.navigate(['/jobs/new']);
  }

  editJob(job: Job) {
    this.router.navigate(['/jobs', job.id, 'edit']);
  }

  viewJob(job: Job) {
    this.router.navigate(['/jobs', job.id]);
  }

  runJob(job: Job) {
    this.store.dispatch(JobsActions.runJob({ id: job.id! }));
  }

  deleteJob(job: Job) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete job "${job.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.dispatch(JobsActions.deleteJob({ id: job.id! })),
    });
  }

  getStatusSeverity(status: JobStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<JobStatus, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      [JobStatus.IDLE]: 'secondary',
      [JobStatus.QUEUED]: 'info',
      [JobStatus.RUNNING]: 'warn',
      [JobStatus.COMPLETED]: 'success',
      [JobStatus.FAILED]: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  canRun(status: JobStatus): boolean {
    return status !== JobStatus.RUNNING && status !== JobStatus.QUEUED;
  }
}
