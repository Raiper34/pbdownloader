import { createFeatureSelector, createSelector } from '@ngrx/store';
import { JobsState, selectAll } from './jobs.reducer';

export const selectJobsFeature = createFeatureSelector<JobsState>('jobs');

export const selectAllJobs = createSelector(selectJobsFeature, selectAll);
export const selectJobsLoading = createSelector(selectJobsFeature, (s) => s.loading);
export const selectJobsError = createSelector(selectJobsFeature, (s) => s.error);
export const selectJobProgressMap = createSelector(selectJobsFeature, (s) => s.progressMap);
