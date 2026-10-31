import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MessageService } from 'primeng/api';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import * as DownloadsActions from './downloads.actions';

@Injectable()
export class DownloadsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private messageService = inject(MessageService);

  loadDownloads$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DownloadsActions.loadDownloads),
      mergeMap(() =>
        this.api.getDownloads().pipe(
          map((downloads) => DownloadsActions.loadDownloadsSuccess({ downloads })),
          catchError((err) => of(DownloadsActions.loadDownloadsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  deleteDownload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DownloadsActions.deleteDownload),
      mergeMap(({ id }) =>
        this.api.deleteDownload(id).pipe(
          map(() => DownloadsActions.deleteDownloadSuccess({ id })),
          catchError((err) =>
            of(DownloadsActions.deleteDownloadFailure({ error: err.message })),
          ),
        ),
      ),
    ),
  );

  deleteSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DownloadsActions.deleteDownloadSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Download removed' })),
      ),
    { dispatch: false },
  );
}
