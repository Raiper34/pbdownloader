import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DownloadersState, selectAll } from './downloaders.reducer';

export const selectDownloadersFeature = createFeatureSelector<DownloadersState>('downloaders');

export const selectAllDownloaders = createSelector(selectDownloadersFeature, selectAll);
export const selectDownloadersLoading = createSelector(selectDownloadersFeature, (s) => s.loading);
export const selectDownloadersError = createSelector(selectDownloadersFeature, (s) => s.error);
