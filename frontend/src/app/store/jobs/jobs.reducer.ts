import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { DownloadJob, JobProgress } from '../../core/models/job.model';
import * as JobsActions from './jobs.actions';

export interface JobsState extends EntityState<DownloadJob> {
  loading: boolean;
  error: string | null;
  progressMap: Record<number, JobProgress>;
}

export const adapter: EntityAdapter<DownloadJob> = createEntityAdapter<DownloadJob>();

export const initialState: JobsState = adapter.getInitialState({
  loading: false,
  error: null,
  progressMap: {},
});

export const jobsReducer = createReducer(
  initialState,

  on(JobsActions.loadJobs, (state) => ({ ...state, loading: true, error: null })),
  on(JobsActions.loadJobsSuccess, (state, { jobs }) =>
    adapter.setAll(jobs, { ...state, loading: false }),
  ),
  on(JobsActions.loadJobsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(JobsActions.createJob, (state) => ({ ...state, loading: true })),
  on(JobsActions.createJobSuccess, (state, { job }) =>
    adapter.addOne(job, { ...state, loading: false }),
  ),
  on(JobsActions.createJobFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(JobsActions.retryJob, (state) => ({ ...state, loading: true })),
  on(JobsActions.retryJobSuccess, (state, { job }) =>
    adapter.upsertOne(job, { ...state, loading: false }),
  ),
  on(JobsActions.retryJobFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(JobsActions.deleteJob, (state) => ({ ...state, loading: true })),
  on(JobsActions.deleteJobSuccess, (state, { id }) =>
    adapter.removeOne(id, { ...state, loading: false }),
  ),
  on(JobsActions.deleteJobFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(JobsActions.cancelJob, (state) => ({ ...state, loading: true })),
  on(JobsActions.cancelJobSuccess, (state, { job }) =>
    adapter.upsertOne(job, { ...state, loading: false }),
  ),
  on(JobsActions.cancelJobFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(JobsActions.jobCreatedViaWs, (state, { job }) => adapter.addOne(job, state)),
  on(JobsActions.jobUpdatedViaWs, (state, { job }) => {
    // Keď sa job dokončí/zlyhá/zruší, vyčistíme progress
    const progressMap = { ...state.progressMap };
    if (job.status === 'done' || job.status === 'failed' || job.status === 'cancelled') {
      delete progressMap[job.id];
    }
    return adapter.upsertOne(job, { ...state, progressMap });
  }),
  on(JobsActions.jobProgressViaWs, (state, { progress }) => {
    const prev = state.progressMap[progress.jobId];
    let speedBps: number | undefined;

    if (prev?._ts !== undefined) {
      const timeDiff = Date.now() - prev._ts;
      const bytesDiff = progress.receivedBytes - prev.receivedBytes;
      if (timeDiff > 200 && bytesDiff >= 0) {
        speedBps = Math.round((bytesDiff / timeDiff) * 1000);
      } else {
        speedBps = prev.speedBps; // keep last known speed if events arrive too fast
      }
    }

    return {
      ...state,
      progressMap: {
        ...state.progressMap,
        [progress.jobId]: { ...progress, speedBps, _ts: Date.now() },
      },
    };
  }),
);

export const { selectAll } = adapter.getSelectors();
