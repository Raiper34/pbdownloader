import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProgressState } from './progress.reducer';

export const selectProgressState = createFeatureSelector<ProgressState>('progress');
export const selectActiveJobId = createSelector(selectProgressState, (s) => s.activeJobId);
export const selectProgressSteps = createSelector(selectProgressState, (s) => s.steps);
export const selectJobProgressStatus = createSelector(selectProgressState, (s) => s.jobStatus);
export const selectProgressError = createSelector(selectProgressState, (s) => s.lastError);
