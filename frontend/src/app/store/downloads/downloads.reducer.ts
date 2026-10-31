import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Download } from '../../core/models/download.model';
import * as DownloadsActions from './downloads.actions';

export interface DownloadsState extends EntityState<Download> {
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<Download> = createEntityAdapter<Download>({
  selectId: (d) => d.id,
  sortComparer: false,
});

export const initialState: DownloadsState = adapter.getInitialState({ loading: false, error: null });

export const downloadsReducer = createReducer(
  initialState,
  on(DownloadsActions.loadDownloads, DownloadsActions.deleteDownload, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(DownloadsActions.loadDownloadsSuccess, (state, { downloads }) =>
    adapter.setAll(downloads, { ...state, loading: false }),
  ),
  on(DownloadsActions.deleteDownloadSuccess, (state, { id }) =>
    adapter.removeOne(id, { ...state, loading: false }),
  ),
  on(
    DownloadsActions.loadDownloadsFailure,
    DownloadsActions.deleteDownloadFailure,
    (state, { error }) => ({ ...state, loading: false, error }),
  ),
);
