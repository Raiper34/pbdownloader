import { createAction, props } from '@ngrx/store';
import { DownloadJob, CreateJobRequest, JobProgress } from '../../core/models/job.model';

export const loadJobs = createAction('[Jobs] Load');
export const loadJobsSuccess = createAction('[Jobs] Load Success', props<{ jobs: DownloadJob[] }>());
export const loadJobsFailure = createAction('[Jobs] Load Failure', props<{ error: string }>());

export const createJob = createAction('[Jobs] Create', props<{ data: CreateJobRequest }>());
export const createJobSuccess = createAction('[Jobs] Create Success', props<{ job: DownloadJob }>());
export const createJobFailure = createAction('[Jobs] Create Failure', props<{ error: string }>());

export const retryJob = createAction('[Jobs] Retry', props<{ id: number }>());
export const retryJobSuccess = createAction('[Jobs] Retry Success', props<{ job: DownloadJob }>());
export const retryJobFailure = createAction('[Jobs] Retry Failure', props<{ error: string }>());

export const deleteJob = createAction('[Jobs] Delete', props<{ id: number }>());
export const deleteJobSuccess = createAction('[Jobs] Delete Success', props<{ id: number }>());
export const deleteJobFailure = createAction('[Jobs] Delete Failure', props<{ error: string }>());

export const cancelJob = createAction('[Jobs] Cancel', props<{ id: number }>());
export const cancelJobSuccess = createAction('[Jobs] Cancel Success', props<{ job: DownloadJob }>());
export const cancelJobFailure = createAction('[Jobs] Cancel Failure', props<{ error: string }>());

export const jobCreatedViaWs = createAction('[Jobs] Created via WS', props<{ job: DownloadJob }>());
export const jobUpdatedViaWs = createAction('[Jobs] Updated via WS', props<{ job: DownloadJob }>());
export const jobProgressViaWs = createAction('[Jobs] Progress via WS', props<{ progress: JobProgress }>());
