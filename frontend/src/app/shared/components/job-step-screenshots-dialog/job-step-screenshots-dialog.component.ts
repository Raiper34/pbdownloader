import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { JobLog } from '../../../core/models/job-log.model';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-job-log-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    TagModule,
    ImageModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './job-step-screenshots-dialog.component.html',
  styleUrl: './job-step-screenshots-dialog.component.scss',
})
export class JobLogDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() jobId: number | null = null;

  logs: JobLog[] = [];
  loading = false;
  expandedLogs = new Set<number>();

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true && this.jobId !== null) {
      this.loadLogs();
    }
    if (changes['visible']?.currentValue === false) {
      this.logs = [];
      this.expandedLogs.clear();
    }
  }

  loadLogs(): void {
    if (this.jobId === null) return;
    this.loading = true;
    this.api.getJobLogs(this.jobId).subscribe({
      next: (data) => {
        this.logs = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  toggle(id: number): void {
    if (this.expandedLogs.has(id)) {
      this.expandedLogs.delete(id);
    } else {
      this.expandedLogs.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedLogs.has(id);
  }

  isFailed(log: JobLog): boolean {
    return log.label.includes('(failed)');
  }

  getStepTypeLabel(type: string): string {
    switch (type) {
      case 'click': return 'Click';
      case 'fill': return 'Fill';
      case 'wait': return 'Wait';
      case 'waitForSelector': return 'Wait For Selector';
      default: return type;
    }
  }

  getStepTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (type) {
      case 'click': return 'info';
      case 'fill': return 'success';
      case 'wait': return 'warn';
      case 'waitForSelector': return 'secondary';
      default: return 'secondary';
    }
  }

  getScreenshotUrl(log: JobLog): string {
    return this.api.getJobLogScreenshotUrl(log.jobId, log.id);
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }
}
