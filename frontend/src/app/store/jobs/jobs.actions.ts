import { createAction, props } from '@ngrx/store';
import { Job } from '../../core/models/job.model';

// Load Jobs
export const loadJobs = createAction('[Jobs] Load Jobs');
export const loadJobsSuccess = createAction('[Jobs] Load Jobs Success', props<{ jobs: Job[] }>());
export const loadJobsFailure = createAction('[Jobs] Load Jobs Failure', props<{ error: string }>());

// Load Single Job
export const loadJob = createAction('[Jobs] Load Job', props<{ id: number }>());
export const loadJobSuccess = createAction('[Jobs] Load Job Success', props<{ job: Job }>());
export const loadJobFailure = createAction('[Jobs] Load Job Failure', props<{ error: string }>());

// Create Job
export const createJob = createAction('[Jobs] Create Job', props<{ job: Partial<Job> }>());
export const createJobSuccess = createAction('[Jobs] Create Job Success', props<{ job: Job }>());
export const createJobFailure = createAction('[Jobs] Create Job Failure', props<{ error: string }>());

// Update Job
export const updateJob = createAction('[Jobs] Update Job', props<{ id: number; job: Partial<Job> }>());
export const updateJobSuccess = createAction('[Jobs] Update Job Success', props<{ job: Job }>());
export const updateJobFailure = createAction('[Jobs] Update Job Failure', props<{ error: string }>());

// Delete Job
export const deleteJob = createAction('[Jobs] Delete Job', props<{ id: number }>());
export const deleteJobSuccess = createAction('[Jobs] Delete Job Success', props<{ id: number }>());
export const deleteJobFailure = createAction('[Jobs] Delete Job Failure', props<{ error: string }>());

// Run Job
export const runJob = createAction('[Jobs] Run Job', props<{ id: number }>());
export const runJobSuccess = createAction('[Jobs] Run Job Success', props<{ job: Job }>());
export const runJobFailure = createAction('[Jobs] Run Job Failure', props<{ error: string }>());

// Select Job
export const selectJob = createAction('[Jobs] Select Job', props<{ id: number | null }>());
