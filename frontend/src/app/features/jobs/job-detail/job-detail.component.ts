import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, map, takeUntil } from 'rxjs';
import { Job, JobStatus } from '../../../core/models/job.model';
import * as JobsActions from '../../../store/jobs/jobs.actions';
import { selectJobById } from '../../../store/jobs/jobs.selectors';
import * as ProgressActions from '../../../store/progress/progress.actions';
import {
  selectJobProgressStatus,
  selectProgressError,
  selectProgressSteps,
} from '../../../store/progress/progress.selectors';
import { ProgressStep } from '../../../store/progress/progress.reducer';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss'],
  standalone: false,
})
export class JobDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  jobId!: number;
  job$!: Observable<Job | undefined>;
  progressSteps$!: Observable<ProgressStep[]>;
  jobProgressStatus$!: Observable<JobStatus | null>;
  progressError$!: Observable<string | null>;
  progressValue$!: Observable<number>;

  JobStatus = JobStatus;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.jobId = +id;

    this.job$ = this.store.select(selectJobById(this.jobId));
    this.progressSteps$ = this.store.select(selectProgressSteps);
    this.jobProgressStatus$ = this.store.select(selectJobProgressStatus);
    this.progressError$ = this.store.select(selectProgressError);

    this.progressValue$ = combineLatest([this.progressSteps$]).pipe(
      map(([steps]) => {
        if (!steps.length) return 0;
        const done = steps.filter((s) => s.status === 'success' || s.status === 'error').length;
        return Math.round((done / steps[0].totalSteps) * 100);
      }),
    );

    this.store.dispatch(JobsActions.loadJob({ id: this.jobId }));
    this.store.dispatch(ProgressActions.startWatchingJob({ jobId: this.jobId }));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(ProgressActions.stopWatchingJob());
    this.store.dispatch(ProgressActions.clearProgress());
  }

  runJob() {
    this.store.dispatch(JobsActions.runJob({ id: this.jobId }));
    this.store.dispatch(ProgressActions.clearProgress());
    this.store.dispatch(ProgressActions.startWatchingJob({ jobId: this.jobId }));
  }

  editJob() {
    this.router.navigate(['/jobs', this.jobId, 'edit']);
  }

  getStepStatusIcon(status: string): string {
    const map: Record<string, string> = {
      running: 'pi-spin pi-spinner',
      success: 'pi-check-circle',
      error: 'pi-times-circle',
    };
    return map[status] ?? 'pi-circle';
  }

  getStepStatusClass(status: string): string {
    const map: Record<string, string> = {
      running: 'text-yellow-500',
      success: 'text-green-500',
      error: 'text-red-500',
    };
    return map[status] ?? 'text-secondary';
  }

  getStatusSeverity(status: JobStatus | null): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    if (!status) return 'secondary';
    const map: Record<JobStatus, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      [JobStatus.IDLE]: 'secondary',
      [JobStatus.QUEUED]: 'info',
      [JobStatus.RUNNING]: 'warn',
      [JobStatus.COMPLETED]: 'success',
      [JobStatus.FAILED]: 'danger',
    };
    return map[status] ?? 'secondary';
  }
}
