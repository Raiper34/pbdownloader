import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { Download } from '../../core/models/download.model';
import { ApiService } from '../../core/services/api.service';
import * as DownloadsActions from '../../store/downloads/downloads.actions';
import { selectAllDownloads, selectDownloadsLoading } from '../../store/downloads/downloads.selectors';

@Component({
  selector: 'app-downloads',
  templateUrl: './downloads.component.html',
  styleUrls: ['./downloads.component.scss'],
  standalone: false,
})
export class DownloadsComponent implements OnInit {
  downloads$!: Observable<Download[]>;
  loading$!: Observable<boolean>;

  constructor(
    private store: Store,
    private api: ApiService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.downloads$ = this.store.select(selectAllDownloads);
    this.loading$ = this.store.select(selectDownloadsLoading);
    this.store.dispatch(DownloadsActions.loadDownloads());
  }

  downloadFile(download: Download) {
    window.open(this.api.getDownloadFileUrl(download.id), '_blank');
  }

  deleteDownload(download: Download) {
    this.confirmationService.confirm({
      message: `Remove download record for "${download.filename}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.dispatch(DownloadsActions.deleteDownload({ id: download.id })),
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  refresh() {
    this.store.dispatch(DownloadsActions.loadDownloads());
  }
}
