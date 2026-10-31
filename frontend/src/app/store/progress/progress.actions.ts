import { createAction, props } from '@ngrx/store';
import { JobStatusEvent, ProgressEvent } from '../../core/models/job.model';

export const startWatchingJob = createAction(
  '[Progress] Start Watching Job',
  props<{ jobId: number }>(),
);
export const stopWatchingJob = createAction('[Progress] Stop Watching Job');

export const jobProgressReceived = createAction(
  '[Progress] Job Progress Received',
  props<{ event: ProgressEvent }>(),
);
export const jobStatusReceived = createAction(
  '[Progress] Job Status Received',
  props<{ event: JobStatusEvent }>(),
);
export const clearProgress = createAction('[Progress] Clear Progress');
