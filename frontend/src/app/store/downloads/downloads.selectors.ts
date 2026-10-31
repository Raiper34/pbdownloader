import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, DownloadsState } from './downloads.reducer';

export const selectDownloadsState = createFeatureSelector<DownloadsState>('downloads');
const { selectAll } = adapter.getSelectors();
export const selectAllDownloads = createSelector(selectDownloadsState, selectAll);
export const selectDownloadsLoading = createSelector(selectDownloadsState, (s) => s.loading);
