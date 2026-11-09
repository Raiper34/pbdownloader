import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Downloader } from '../../core/models/downloader.model';
import * as DownloadersActions from './downloaders.actions';

export interface DownloadersState extends EntityState<Downloader> {
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<Downloader> = createEntityAdapter<Downloader>();

export const initialState: DownloadersState = adapter.getInitialState({
  loading: false,
  error: null,
});

export const downloadersReducer = createReducer(
  initialState,

  on(DownloadersActions.loadDownloaders, (state) => ({ ...state, loading: true, error: null })),
  on(DownloadersActions.loadDownloadersSuccess, (state, { downloaders }) =>
    adapter.setAll(downloaders, { ...state, loading: false }),
  ),
  on(DownloadersActions.loadDownloadersFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(DownloadersActions.createDownloader, (state) => ({ ...state, loading: true })),
  on(DownloadersActions.createDownloaderSuccess, (state, { downloader }) =>
    adapter.addOne(downloader, { ...state, loading: false }),
  ),
  on(DownloadersActions.createDownloaderFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(DownloadersActions.updateDownloader, (state) => ({ ...state, loading: true })),
  on(DownloadersActions.updateDownloaderSuccess, (state, { downloader }) =>
    adapter.upsertOne(downloader, { ...state, loading: false }),
  ),
  on(DownloadersActions.updateDownloaderFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(DownloadersActions.deleteDownloader, (state) => ({ ...state, loading: true })),
  on(DownloadersActions.deleteDownloaderSuccess, (state, { id }) =>
    adapter.removeOne(id, { ...state, loading: false }),
  ),
  on(DownloadersActions.deleteDownloaderFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(DownloadersActions.exportDownloader, (state) => ({ ...state, loading: true })),
  on(DownloadersActions.exportDownloaderSuccess, (state) => ({ ...state, loading: false })),
  on(DownloadersActions.exportDownloaderFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(DownloadersActions.exportDownloaders, (state) => ({ ...state, loading: true })),
  on(DownloadersActions.exportDownloadersSuccess, (state) => ({ ...state, loading: false })),
  on(DownloadersActions.exportDownloadersFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(DownloadersActions.importDownloader, (state) => ({ ...state, loading: true })),
  on(DownloadersActions.importDownloaderSuccess, (state, { downloader }) =>
    adapter.addOne(downloader, { ...state, loading: false }),
  ),
  on(DownloadersActions.importDownloaderFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(DownloadersActions.importDownloaders, (state) => ({ ...state, loading: true })),
  on(DownloadersActions.importDownloadersSuccess, (state, { downloaders }) =>
    adapter.addMany(downloaders, { ...state, loading: false }),
  ),
  on(DownloadersActions.importDownloadersFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

export const { selectAll, selectEntities } = adapter.getSelectors();
