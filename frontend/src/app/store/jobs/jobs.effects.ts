import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { WebsocketService } from '../../core/services/websocket.service';
import * as JobsActions from './jobs.actions';

export const loadJobs$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(JobsActions.loadJobs),
      mergeMap(() =>
        api.getJobs().pipe(
          map((jobs) => JobsActions.loadJobsSuccess({ jobs })),
          catchError((err) => of(JobsActions.loadJobsFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const createJob$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(JobsActions.createJob),
      mergeMap(({ data }) =>
        api.createJob(data).pipe(
          map((job) => JobsActions.createJobSuccess({ job })),
          catchError((err) => of(JobsActions.createJobFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const retryJob$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(JobsActions.retryJob),
      mergeMap(({ id }) =>
        api.retryJob(id).pipe(
          map((job) => JobsActions.retryJobSuccess({ job })),
          catchError((err) => of(JobsActions.retryJobFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const deleteJob$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(JobsActions.deleteJob),
      mergeMap(({ id }) =>
        api.deleteJob(id).pipe(
          map(() => JobsActions.deleteJobSuccess({ id })),
          catchError((err) => of(JobsActions.deleteJobFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const cancelJob$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(JobsActions.cancelJob),
      mergeMap(({ id }) =>
        api.cancelJob(id).pipe(
          map((job) => JobsActions.cancelJobSuccess({ job })),
          catchError((err) => of(JobsActions.cancelJobFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const wsJobCreated$ = createEffect(
  (ws = inject(WebsocketService)) =>
    ws.onJobCreated().pipe(
      map((job) => JobsActions.jobCreatedViaWs({ job })),
    ),
  { functional: true },
);

export const wsJobUpdated$ = createEffect(
  (ws = inject(WebsocketService)) =>
    ws.onJobUpdated().pipe(
      map((job) => JobsActions.jobUpdatedViaWs({ job })),
    ),
  { functional: true },
);

export const wsJobProgress$ = createEffect(
  (ws = inject(WebsocketService)) =>
    ws.onJobProgress().pipe(
      map((progress) => JobsActions.jobProgressViaWs({ progress })),
    ),
  { functional: true },
);
