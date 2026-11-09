import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

import { DownloadJob, JobProgress } from '../../core/models/job.model';
import { Downloader } from '../../core/models/downloader.model';
import { ApiService } from '../../core/services/api.service';
import { selectAllJobs, selectJobsLoading, selectJobProgressMap } from '../../store/jobs/jobs.selectors';
import { selectAllDownloaders } from '../../store/downloaders/downloaders.selectors';
import { loadJobs, createJob, retryJob, deleteJob, cancelJob } from '../../store/jobs/jobs.actions';
import { loadDownloaders } from '../../store/downloaders/downloaders.actions';
import { JobLogDialogComponent } from '../../shared/components/job-step-screenshots-dialog/job-step-screenshots-dialog.component';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    InputGroupModule,
    InputGroupAddonModule,
    TableModule,
    TagModule,
    CardModule,
    ProgressBarModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    MenuModule,
    ConfirmDialogModule,
    JobLogDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './download.component.html',
  styleUrl: './download.component.scss',
})
export class DownloadComponent implements OnInit, OnDestroy {
  @ViewChild('jobMenu') jobMenu!: Menu;

  url = '';
  selectedDownloaderId: number | null = null;
  screenshotDialogVisible = false;
  screenshotUrl: string | null = null;
  logDialogVisible = false;
  logDialogJobId: number | null = null;
  jobMenuItems: MenuItem[] = [];
  selectedJobs: DownloadJob[] = [];
  bulkMode = false;

  statusFilterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'running', label: 'Running' },
    { value: 'done', label: 'Done' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  jobs$: Observable<DownloadJob[]>;
  jobsLoading$: Observable<boolean>;
  downloaders$: Observable<Downloader[]>;
  progressMap$: Observable<Record<number, JobProgress>>;

  private downloaders: Downloader[] = [];
  private downloadersSub!: Subscription;

  constructor(
    private store: Store,
    private api: ApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {
    this.jobs$ = this.store.select(selectAllJobs);
    this.jobsLoading$ = this.store.select(selectJobsLoading);
    this.downloaders$ = this.store.select(selectAllDownloaders);
    this.progressMap$ = this.store.select(selectJobProgressMap);
  }

  ngOnInit(): void {
    this.store.dispatch(loadJobs());
    this.store.dispatch(loadDownloaders());
    this.downloadersSub = this.downloaders$.subscribe((list) => {
      this.downloaders = list;
    });
  }

  ngOnDestroy(): void {
    this.downloadersSub.unsubscribe();
  }

  onUrlChange(): void {
    const trimmed = this.url.trim();
    if (!trimmed) {
      return;
    }
    const match = this.downloaders.find((d) => {
      try {
        return new RegExp(d.urlPattern).test(trimmed);
      } catch {
        return false;
      }
    });
    if (match) {
      this.selectedDownloaderId = match.id;
    }
  }

  startDownload(): void {
    if (!this.url.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter a URL' });
      return;
    }

    this.store.dispatch(
      createJob({
        data: {
          url: this.url.trim(),
          downloaderId: this.selectedDownloaderId ?? undefined,
        },
      }),
    );

    this.url = '';
    this.selectedDownloaderId = null;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'done': return 'success';
      case 'running': return 'info';
      case 'pending': return 'warn';
      case 'failed': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'done': return 'Done';
      case 'running': return 'Running';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  downloadFile(job: DownloadJob): void {
    window.open(this.api.getJobDownloadUrl(job.id), '_blank');
  }

  retryJob(job: DownloadJob): void {
    this.store.dispatch(retryJob({ id: job.id }));
  }

  deleteJob(job: DownloadJob): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this job?`,
      header: 'Confirm Delete',
      icon: 'fas fa-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.dispatch(deleteJob({ id: job.id }));
      },
    });
  }

  cancelJob(job: DownloadJob): void {
    this.store.dispatch(cancelJob({ id: job.id }));
  }

  viewScreenshot(job: DownloadJob): void {
    this.screenshotUrl = this.api.getJobScreenshotUrl(job.id);
    this.screenshotDialogVisible = true;
  }

  downloadHtml(job: DownloadJob): void {
    const a = document.createElement('a');
    a.href = this.api.getJobHtmlUrl(job.id);
    a.download = `job-${job.id}.html`;
    a.click();
  }

  viewLog(job: DownloadJob): void {
    this.logDialogJobId = job.id;
    this.logDialogVisible = true;
  }

  openJobMenu(event: MouseEvent, job: DownloadJob): void {
    const items: MenuItem[] = [
      {
        label: 'Open URL',
        icon: 'fas fa-external-link-alt',
        command: () => window.open(job.url, '_blank', 'noopener,noreferrer'),
      },
      { separator: true },
    ];

    if (job.status === 'done') {
      items.push({
        label: 'Download file',
        icon: 'fas fa-file-download',
        command: () => this.downloadFile(job),
      });
    }

    if (job.status === 'running' || job.status === 'pending') {
      items.push({
        label: 'Cancel',
        icon: 'fas fa-stop',
        command: () => this.cancelJob(job),
      });
    }

    if (job.status === 'running' || job.status === 'done' || job.status === 'failed' || job.status === 'cancelled') {
      items.push({
        label: 'Log',
        icon: 'fas fa-list-alt',
        command: () => this.viewLog(job),
      });
    }

    if (job.status === 'failed' && job.htmlPath) {
      items.push({
        label: 'Download HTML',
        icon: 'fas fa-code',
        command: () => this.downloadHtml(job),
      });
    }

    if (job.status === 'failed' || job.status === 'done' || job.status === 'cancelled') {
      items.push({
        label: 'Retry',
        icon: 'fas fa-redo',
        command: () => this.retryJob(job),
      });
    }

    if (job.status !== 'running' && job.status !== 'pending') {
      if (items.length > 0) {
        items.push({ separator: true });
      }
      items.push({
        label: 'Delete',
        icon: 'fas fa-trash',
        styleClass: 'menu-item-danger',
        command: () => this.deleteJob(job),
      });
    }

    this.jobMenuItems = items;
    this.jobMenu.toggle(event);
  }

  toggleBulkMode(): void {
    this.bulkMode = !this.bulkMode;
    if (!this.bulkMode) {
      this.selectedJobs = [];
    }
  }

  get canBulkRetry(): boolean {
    return this.selectedJobs.some(
      (j) => j.status === 'failed' || j.status === 'done' || j.status === 'cancelled',
    );
  }

  get canBulkDelete(): boolean {
    return this.selectedJobs.some((j) => j.status !== 'running' && j.status !== 'pending');
  }

  bulkRetry(): void {
    const retryable = this.selectedJobs.filter(
      (j) => j.status === 'failed' || j.status === 'done' || j.status === 'cancelled',
    );
    retryable.forEach((j) => this.store.dispatch(retryJob({ id: j.id })));
    this.selectedJobs = [];
  }

  bulkDelete(): void {
    const deletable = this.selectedJobs.filter(
      (j) => j.status !== 'running' && j.status !== 'pending',
    );
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${deletable.length} job(s)?`,
      header: 'Confirm Bulk Delete',
      icon: 'fas fa-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        deletable.forEach((j) => this.store.dispatch(deleteJob({ id: j.id })));
        this.selectedJobs = [];
      },
    });
  }

  bulkExportJobs(): void {
    const exportable = this.selectedJobs.filter((j) => j.status === 'done' && j.fileName);
    exportable.forEach((j) => this.downloadFile(j));
    this.selectedJobs = [];
  }

  get canBulkExportJobs(): boolean {
    return this.selectedJobs.some((j) => j.status === 'done' && j.fileName);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  }

  getProgressTooltip(progress: JobProgress): string {
    const received = this.formatBytes(progress.receivedBytes);
    if (progress.totalBytes > 0) {
      return `${received} / ${this.formatBytes(progress.totalBytes)}`;
    }
    return received;
  }
}
