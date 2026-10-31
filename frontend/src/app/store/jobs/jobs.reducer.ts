import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Job } from '../../core/models/job.model';
import * as JobsActions from './jobs.actions';

export interface JobsState extends EntityState<Job> {
  selectedJobId: number | null;
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<Job> = createEntityAdapter<Job>({
  selectId: (job) => job.id!,
  sortComparer: false,
});

export const initialState: JobsState = adapter.getInitialState({
  selectedJobId: null,
  loading: false,
  error: null,
});

export const jobsReducer = createReducer(
  initialState,

  on(JobsActions.loadJobs, JobsActions.loadJob, (state) => ({ ...state, loading: true, error: null })),

  on(JobsActions.loadJobsSuccess, (state, { jobs }) =>
    adapter.setAll(jobs, { ...state, loading: false }),
  ),

  on(JobsActions.loadJobSuccess, (state, { job }) =>
    adapter.upsertOne(job, { ...state, loading: false }),
  ),

  on(JobsActions.loadJobsFailure, JobsActions.loadJobFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(JobsActions.createJobSuccess, (state, { job }) =>
    adapter.addOne(job, { ...state, loading: false }),
  ),

  on(JobsActions.updateJobSuccess, JobsActions.runJobSuccess, (state, { job }) =>
    adapter.upsertOne(job, { ...state, loading: false }),
  ),

  on(JobsActions.deleteJobSuccess, (state, { id }) =>
    adapter.removeOne(id, { ...state, loading: false }),
  ),

  on(
    JobsActions.createJob,
    JobsActions.updateJob,
    JobsActions.deleteJob,
    JobsActions.runJob,
    (state) => ({ ...state, loading: true, error: null }),
  ),

  on(
    JobsActions.createJobFailure,
    JobsActions.updateJobFailure,
    JobsActions.deleteJobFailure,
    JobsActions.runJobFailure,
    (state, { error }) => ({ ...state, loading: false, error }),
  ),

  on(JobsActions.selectJob, (state, { id }) => ({ ...state, selectedJobId: id })),
);
