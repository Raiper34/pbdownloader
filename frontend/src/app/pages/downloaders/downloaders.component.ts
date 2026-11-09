import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

import { Downloader, Step, StepType } from '../../core/models/downloader.model';
import { selectAllDownloaders, selectDownloadersLoading } from '../../store/downloaders/downloaders.selectors';
import {
  loadDownloaders,
  createDownloader,
  updateDownloader,
  deleteDownloader,
  exportDownloader,
  exportDownloaders,
  importDownloader,
  importDownloaders,
} from '../../store/downloaders/downloaders.actions';

@Component({
  selector: 'app-downloaders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TagModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    MenuModule,
    InputNumberModule,
    CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './downloaders.component.html',
  styleUrl: './downloaders.component.scss',
})
export class DownloadersComponent implements OnInit {
  @ViewChild('downloaderMenu') downloaderMenu!: Menu;
  @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

  downloaders$: Observable<Downloader[]>;
  loading$: Observable<boolean>;

  dialogVisible = false;
  editingId: number | null = null;
  downloaderMenuItems: MenuItem[] = [];
  focusedSelectorIndex: number | null = null;
  selectedDownloaders: Downloader[] = [];
  bulkMode = false;

  form: FormGroup;

  stepTypeOptions = [
    { label: 'Click', value: 'click' },
    { label: 'Fill', value: 'fill' },
    { label: 'Wait', value: 'wait' },
    { label: 'Wait for selector', value: 'waitForSelector' },
  ];

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.downloaders$ = this.store.select(selectAllDownloaders);
    this.loading$ = this.store.select(selectDownloadersLoading);
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.store.dispatch(loadDownloaders());
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      urlPattern: ['', Validators.required],
      description: [''],
      titleSelector: [''],
      maxConcurrentJobs: [1],
      jobDelay: [0],
      steps: this.fb.array([]),
    });
  }

  get stepsArray(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  openCreateDialog(): void {
    this.editingId = null;
    this.form = this.createForm();
    this.focusedSelectorIndex = null;
    this.dialogVisible = true;
  }

  openEditDialog(downloader: Downloader): void {
    this.focusedSelectorIndex = null;
    this.editingId = downloader.id;
    this.form = this.createForm();
    this.form.patchValue({
      name: downloader.name,
      urlPattern: downloader.urlPattern,
      description: downloader.description ?? '',
      titleSelector: downloader.titleSelector ?? '',
      maxConcurrentJobs: downloader.maxConcurrentJobs ?? 1,
      jobDelay: downloader.jobDelay ?? 0,
    });

    const sortedSteps = [...downloader.steps].sort((a, b) => a.order - b.order);
    sortedSteps.forEach((step) => this.addStep(step));

    this.dialogVisible = true;
  }

  addStep(step?: Partial<Step>): void {
    this.stepsArray.push(
      this.fb.group({
        order: [step?.order ?? this.stepsArray.length],
        type: [step?.type ?? 'click', Validators.required],
        selector: [step?.selector ?? ''],
        value: [step?.value ?? ''],
        negate: [step?.negate ?? false],
        optional: [step?.optional ?? false],
      }),
    );
  }

  removeStep(index: number): void {
    this.stepsArray.removeAt(index);
    this.reorderSteps();
  }

  dropStep(event: CdkDragDrop<unknown[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const controls = this.stepsArray.controls.slice();
    moveItemInArray(controls, event.previousIndex, event.currentIndex);
    controls.forEach((ctrl, i) => {
      this.stepsArray.setControl(i, ctrl);
    });
    this.reorderSteps();
  }

  private reorderSteps(): void {
    this.stepsArray.controls.forEach((ctrl, i) => {
      ctrl.patchValue({ order: i });
    });
  }

  saveDownloader(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const data = {
      name: value.name,
      urlPattern: value.urlPattern,
      description: value.description,
      titleSelector: value.titleSelector || undefined,
      maxConcurrentJobs: value.maxConcurrentJobs ?? 1,
      jobDelay: value.jobDelay ?? 0,
      steps: value.steps.map((s: any, i: number) => ({
        order: i,
        type: s.type as StepType,
        selector: s.type === 'wait' ? undefined : s.selector,
        value: s.type === 'wait'
          ? String(s.value || '1000')
          : (s.value || undefined),
        negate: s.type === 'waitForSelector' ? (s.negate ?? false) : undefined,
        optional: s.optional ?? false,
      })),
    };

    if (this.editingId !== null) {
      this.store.dispatch(updateDownloader({ id: this.editingId, data }));
    } else {
      this.store.dispatch(createDownloader({ data }));
    }

    this.dialogVisible = false;
  }

  confirmDelete(downloader: Downloader): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete downloader "${downloader.name}"?`,
      header: 'Confirm Delete',
      icon: 'fas fa-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.dispatch(deleteDownloader({ id: downloader.id }));
      },
    });
  }

  getFirstSteps(steps: Step[]): Step[] {
    return steps.slice(0, 3);
  }

  getStepTypeLabel(type: StepType): string {
    switch (type) {
      case 'click': return 'Click';
      case 'fill': return 'Fill';
      case 'wait': return 'Wait';
      case 'waitForSelector': return 'Wait for selector';
      default: return type;
    }
  }

  openDownloaderMenu(event: MouseEvent, downloader: Downloader): void {
    this.downloaderMenuItems = [
      {
        label: 'Edit',
        icon: 'fas fa-edit',
        command: () => this.openEditDialog(downloader),
      },
      {
        label: 'Export',
        icon: 'fas fa-file-export',
        command: () => this.store.dispatch(exportDownloader({ id: downloader.id })),
      },
      { separator: true },
      {
        label: 'Delete',
        icon: 'fas fa-trash',
        styleClass: 'menu-item-danger',
        command: () => this.confirmDelete(downloader),
      },
    ];
    this.downloaderMenu.toggle(event);
  }

  getStepTypeSeverity(type: StepType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (type) {
      case 'click': return 'info';
      case 'fill': return 'warn';
      case 'wait': return 'secondary';
      case 'waitForSelector': return 'success';
      default: return 'secondary';
    }
  }

  getStepTooltip(step: Step): string {
    const parts: string[] = [this.getStepTypeLabel(step.type)];
    if (step.selector) parts.push(`Selector: ${step.selector}`);
    if (step.value) parts.push(`Value: ${step.value}`);
    if (step.optional) parts.push('Optional');
    if (step.negate) parts.push('Negate');
    return parts.join('\n');
  }

  onSelectorBlur(event: FocusEvent, index: number): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = '';
    this.focusedSelectorIndex = null;
  }

  onStepTypeChange(index: number): void {
    const ctrl = this.stepsArray.at(index);
    const type = ctrl.get('type')?.value;
    ctrl.patchValue({
      selector: '',
      value: '',
      negate: false,
      optional: type === 'wait' ? false : ctrl.get('optional')?.value,
    });
  }

  toggleFlag(index: number, flag: 'optional' | 'negate'): void {
    const ctrl = this.stepsArray.at(index).get(flag);
    if (ctrl) ctrl.setValue(!ctrl.value);
  }

  getMoreStepsTooltip(steps: Step[]): string {
    return steps
      .slice(3)
      .map((step, i) => `${i + 4}. ${this.getStepTypeLabel(step.type)}${step.selector ? ' · ' + step.selector : ''}`)
      .join('\n');
  }

  toggleBulkMode(): void {
    this.bulkMode = !this.bulkMode;
    if (!this.bulkMode) {
      this.selectedDownloaders = [];
    }
  }

  bulkDelete(): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${this.selectedDownloaders.length} downloader(s)?`,
      header: 'Confirm Bulk Delete',
      icon: 'fas fa-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.selectedDownloaders.forEach((d) =>
          this.store.dispatch(deleteDownloader({ id: d.id })),
        );
        this.selectedDownloaders = [];
      },
    });
  }

  bulkExport(): void {
    this.store.dispatch(exportDownloaders({ ids: this.selectedDownloaders.map((d) => d.id) }));
    this.selectedDownloaders = [];
  }

  triggerImport(): void {
    this.importFileInput.nativeElement.value = '';
    this.importFileInput.nativeElement.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const isBulk =
          data &&
          typeof data === 'object' &&
          Array.isArray((data as { downloaders?: unknown }).downloaders);

        if (isBulk) {
          const items = (data as { downloaders: object[] }).downloaders;
          this.store.dispatch(importDownloaders({ items }));
          this.messageService.add({
            severity: 'success',
            summary: 'Import started',
            detail: `Importing ${items.length} downloader(s).`,
          });
        } else {
          this.store.dispatch(importDownloader({ data }));
          this.messageService.add({
            severity: 'success',
            summary: 'Import started',
            detail: 'Downloader is being imported.',
          });
        }
      } catch {
        this.messageService.add({
          severity: 'error',
          summary: 'Import failed',
          detail: 'Invalid JSON file.',
        });
      }
      this.cdr.detectChanges();
    };
    reader.readAsText(file);
  }
}
