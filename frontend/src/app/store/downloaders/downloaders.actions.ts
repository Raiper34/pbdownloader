import { createAction, props } from '@ngrx/store';
import { Downloader, CreateDownloaderRequest } from '../../core/models/downloader.model';

export const loadDownloaders = createAction('[Downloaders] Load');
export const loadDownloadersSuccess = createAction('[Downloaders] Load Success', props<{ downloaders: Downloader[] }>());
export const loadDownloadersFailure = createAction('[Downloaders] Load Failure', props<{ error: string }>());

export const createDownloader = createAction('[Downloaders] Create', props<{ data: CreateDownloaderRequest }>());
export const createDownloaderSuccess = createAction('[Downloaders] Create Success', props<{ downloader: Downloader }>());
export const createDownloaderFailure = createAction('[Downloaders] Create Failure', props<{ error: string }>());

export const updateDownloader = createAction('[Downloaders] Update', props<{ id: number; data: Partial<CreateDownloaderRequest> }>());
export const updateDownloaderSuccess = createAction('[Downloaders] Update Success', props<{ downloader: Downloader }>());
export const updateDownloaderFailure = createAction('[Downloaders] Update Failure', props<{ error: string }>());

export const deleteDownloader = createAction('[Downloaders] Delete', props<{ id: number }>());
export const deleteDownloaderSuccess = createAction('[Downloaders] Delete Success', props<{ id: number }>());
export const deleteDownloaderFailure = createAction('[Downloaders] Delete Failure', props<{ error: string }>());

export const exportDownloader = createAction('[Downloaders] Export', props<{ id: number }>());
export const exportDownloaderSuccess = createAction('[Downloaders] Export Success');
export const exportDownloaderFailure = createAction('[Downloaders] Export Failure', props<{ error: string }>());

export const exportDownloaders = createAction('[Downloaders] Export Bulk', props<{ ids: number[] }>());
export const exportDownloadersSuccess = createAction('[Downloaders] Export Bulk Success');
export const exportDownloadersFailure = createAction('[Downloaders] Export Bulk Failure', props<{ error: string }>());

export const importDownloader = createAction('[Downloaders] Import', props<{ data: object }>());
export const importDownloaderSuccess = createAction('[Downloaders] Import Success', props<{ downloader: Downloader }>());
export const importDownloaderFailure = createAction('[Downloaders] Import Failure', props<{ error: string }>());

export const importDownloaders = createAction('[Downloaders] Import Bulk', props<{ items: object[] }>());
export const importDownloadersSuccess = createAction('[Downloaders] Import Bulk Success', props<{ downloaders: Downloader[] }>());
export const importDownloadersFailure = createAction('[Downloaders] Import Bulk Failure', props<{ error: string }>());
