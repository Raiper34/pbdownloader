import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, switchMap } from 'rxjs';
import { WebSocketService } from '../../core/services/websocket.service';
import { loadJobs } from '../jobs/jobs.actions';
import * as ProgressActions from './progress.actions';

@Injectable()
export class ProgressEffects {
  private actions$ = inject(Actions);
  private wsService = inject(WebSocketService);
  private store = inject(Store);

  listenProgress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProgressActions.startWatchingJob),
      switchMap(({ jobId }) => {
        return this.wsService.onJobProgress().pipe(
          switchMap((event) => {
            if (event.jobId === jobId) {
              return [ProgressActions.jobProgressReceived({ event })];
            }
            return EMPTY;
          }),
        );
      }),
    ),
  );

  listenStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProgressActions.startWatchingJob),
      switchMap(({ jobId }) => {
        return this.wsService.onJobStatus().pipe(
          switchMap((event) => {
            if (event.jobId === jobId) {
              this.store.dispatch(loadJobs());
              return [ProgressActions.jobStatusReceived({ event })];
            }
            return EMPTY;
          }),
        );
      }),
    ),
  );
}
