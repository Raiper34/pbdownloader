import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, JobsState } from './jobs.reducer';

export const selectJobsState = createFeatureSelector<JobsState>('jobs');

const { selectAll, selectEntities } = adapter.getSelectors();

export const selectAllJobs = createSelector(selectJobsState, selectAll);
export const selectJobEntities = createSelector(selectJobsState, selectEntities);
export const selectJobsLoading = createSelector(selectJobsState, (s) => s.loading);
export const selectJobsError = createSelector(selectJobsState, (s) => s.error);
export const selectSelectedJobId = createSelector(selectJobsState, (s) => s.selectedJobId);
export const selectSelectedJob = createSelector(
  selectJobEntities,
  selectSelectedJobId,
  (entities, id) => (id != null ? entities[id] : null),
);
export const selectJobById = (id: number) =>
  createSelector(selectJobEntities, (entities) => entities[id]);
