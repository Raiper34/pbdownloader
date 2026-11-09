import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import * as DownloadersActions from './downloaders.actions';

export const loadDownloaders$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.loadDownloaders),
      mergeMap(() =>
        api.getDownloaders().pipe(
          map((downloaders) => DownloadersActions.loadDownloadersSuccess({ downloaders })),
          catchError((err) => of(DownloadersActions.loadDownloadersFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const createDownloader$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.createDownloader),
      mergeMap(({ data }) =>
        api.createDownloader(data).pipe(
          map((downloader) => DownloadersActions.createDownloaderSuccess({ downloader })),
          catchError((err) => of(DownloadersActions.createDownloaderFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateDownloader$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.updateDownloader),
      mergeMap(({ id, data }) =>
        api.updateDownloader(id, data).pipe(
          map((downloader) => DownloadersActions.updateDownloaderSuccess({ downloader })),
          catchError((err) => of(DownloadersActions.updateDownloaderFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const deleteDownloader$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.deleteDownloader),
      mergeMap(({ id }) =>
        api.deleteDownloader(id).pipe(
          map(() => DownloadersActions.deleteDownloaderSuccess({ id })),
          catchError((err) => of(DownloadersActions.deleteDownloaderFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const exportDownloader$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.exportDownloader),
      mergeMap(({ id }) =>
        api.exportDownloader(id).pipe(
          tap((data) => {
            const payload = data as { name?: string };
            const slug = (payload.name ?? `downloader-${id}`)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }),
          map(() => DownloadersActions.exportDownloaderSuccess()),
          catchError((err) => of(DownloadersActions.exportDownloaderFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const importDownloader$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.importDownloader),
      mergeMap(({ data }) =>
        api.importDownloader(data).pipe(
          map((downloader) => DownloadersActions.importDownloaderSuccess({ downloader })),
          catchError((err) => of(DownloadersActions.importDownloaderFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const exportDownloaders$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.exportDownloaders),
      mergeMap(({ ids }) =>
        forkJoin(ids.map((id) => api.exportDownloader(id))).pipe(
          tap((items) => {
            const bundle = {
              version: 1,
              exportedAt: new Date().toISOString(),
              downloaders: items,
            };
            const json = JSON.stringify(bundle, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `downloaders-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }),
          map(() => DownloadersActions.exportDownloadersSuccess()),
          catchError((err) => of(DownloadersActions.exportDownloadersFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const importDownloaders$ = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DownloadersActions.importDownloaders),
      mergeMap(({ items }) =>
        forkJoin(items.map((data) => api.importDownloader(data))).pipe(
          map((downloaders) => DownloadersActions.importDownloadersSuccess({ downloaders })),
          catchError((err) => of(DownloadersActions.importDownloadersFailure({ error: err.message }))),
        ),
      ),
    ),
  { functional: true },
);
