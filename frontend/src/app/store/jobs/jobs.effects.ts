import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MessageService } from 'primeng/api';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import * as JobsActions from './jobs.actions';

@Injectable()
export class JobsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loadJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobsActions.loadJobs),
      mergeMap(() =>
        this.api.getJobs().pipe(
          map((jobs) => JobsActions.loadJobsSuccess({ jobs })),
          catchError((err) => of(JobsActions.loadJobsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loadJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobsActions.loadJob),
      mergeMap(({ id }) =>
        this.api.getJob(id).pipe(
          map((job) => JobsActions.loadJobSuccess({ job })),
          catchError((err) => of(JobsActions.loadJobFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobsActions.createJob),
      mergeMap(({ job }) =>
        this.api.createJob(job).pipe(
          map((created) => JobsActions.createJobSuccess({ job: created })),
          catchError((err) => of(JobsActions.createJobFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createJobSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(JobsActions.createJobSuccess),
        tap(({ job }) => {
          this.messageService.add({ severity: 'success', summary: 'Job created', detail: job.name });
          this.router.navigate(['/jobs']);
        }),
      ),
    { dispatch: false },
  );

  updateJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobsActions.updateJob),
      mergeMap(({ id, job }) =>
        this.api.updateJob(id, job).pipe(
          map((updated) => JobsActions.updateJobSuccess({ job: updated })),
          catchError((err) => of(JobsActions.updateJobFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  updateJobSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(JobsActions.updateJobSuccess),
        tap(({ job }) => {
          this.messageService.add({ severity: 'success', summary: 'Job updated', detail: job.name });
          this.router.navigate(['/jobs']);
        }),
      ),
    { dispatch: false },
  );

  deleteJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobsActions.deleteJob),
      mergeMap(({ id }) =>
        this.api.deleteJob(id).pipe(
          map(() => JobsActions.deleteJobSuccess({ id })),
          catchError((err) => of(JobsActions.deleteJobFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  deleteJobSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(JobsActions.deleteJobSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Job deleted' })),
      ),
    { dispatch: false },
  );

  runJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobsActions.runJob),
      mergeMap(({ id }) =>
        this.api.runJob(id).pipe(
          map((job) => JobsActions.runJobSuccess({ job })),
          catchError((err) => of(JobsActions.runJobFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  runJobSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(JobsActions.runJobSuccess),
        tap(({ job }) => {
          this.messageService.add({ severity: 'success', summary: 'Job queued', detail: job.name });
          this.router.navigate(['/jobs', job.id]);
        }),
      ),
    { dispatch: false },
  );

  errors$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          JobsActions.loadJobsFailure,
          JobsActions.loadJobFailure,
          JobsActions.createJobFailure,
          JobsActions.updateJobFailure,
          JobsActions.deleteJobFailure,
          JobsActions.runJobFailure,
        ),
        tap(({ error }) =>
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error }),
        ),
      ),
    { dispatch: false },
  );
}
