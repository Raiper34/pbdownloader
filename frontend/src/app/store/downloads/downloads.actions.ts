import { createAction, props } from '@ngrx/store';
import { Download } from '../../core/models/download.model';

export const loadDownloads = createAction('[Downloads] Load Downloads');
export const loadDownloadsSuccess = createAction(
  '[Downloads] Load Downloads Success',
  props<{ downloads: Download[] }>(),
);
export const loadDownloadsFailure = createAction(
  '[Downloads] Load Downloads Failure',
  props<{ error: string }>(),
);

export const deleteDownload = createAction('[Downloads] Delete Download', props<{ id: number }>());
export const deleteDownloadSuccess = createAction(
  '[Downloads] Delete Download Success',
  props<{ id: number }>(),
);
export const deleteDownloadFailure = createAction(
  '[Downloads] Delete Download Failure',
  props<{ error: string }>(),
);
