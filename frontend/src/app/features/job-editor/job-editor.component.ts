import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';
import { Job, JobStatus, StepType } from '../../core/models/job.model';
import * as JobsActions from '../../store/jobs/jobs.actions';
import { selectJobById } from '../../store/jobs/jobs.selectors';

@Component({
  selector: 'app-job-editor',
  templateUrl: './job-editor.component.html',
  styleUrls: ['./job-editor.component.scss'],
  standalone: false,
})
export class JobEditorComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  jobId: number | null = null;
  showStepDialog = false;
  editingStepIndex: number | null = null;
  stepForm!: FormGroup;

  stepTypes = [
    { label: 'Navigate to URL', value: StepType.NAVIGATE, icon: 'pi-globe' },
    { label: 'Click Element', value: StepType.CLICK, icon: 'pi-cursor' },
    { label: 'Fill Input', value: StepType.FILL, icon: 'pi-pencil' },
    { label: 'Wait', value: StepType.WAIT, icon: 'pi-clock' },
    { label: 'Download', value: StepType.DOWNLOAD, icon: 'pi-download' },
    { label: 'Screenshot', value: StepType.SCREENSHOT, icon: 'pi-camera' },
  ];

  StepType = StepType;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.initForms();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.jobId = +id;
      this.store.dispatch(JobsActions.loadJob({ id: +id }));
      this.store
        .select(selectJobById(+id))
        .pipe(
          filter((job): job is Job => !!job),
          take(1),
        )
        .subscribe((job) => this.patchForm(job));
    }
  }

  initForms() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      targetUrl: ['', Validators.required],
      downloadPath: ['./downloads'],
      cronExpression: [''],
      steps: this.fb.array([]),
    });
    this.initStepForm();
  }

  initStepForm() {
    this.stepForm = this.fb.group({
      type: [StepType.NAVIGATE, Validators.required],
      description: ['', Validators.required],
      selector: [''],
      value: [''],
      url: [''],
      timeout: [30000],
    });
  }

  patchForm(job: Job) {
    this.form.patchValue({
      name: job.name,
      description: job.description,
      targetUrl: job.targetUrl,
      downloadPath: job.downloadPath,
      cronExpression: job.cronExpression,
    });
    const steps = this.form.get('steps') as FormArray;
    steps.clear();
    const sorted = [...job.steps].sort((a, b) => a.order - b.order);
    sorted.forEach((step) => steps.push(this.fb.group(step)));
  }

  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  openAddStep() {
    this.editingStepIndex = null;
    this.initStepForm();
    this.showStepDialog = true;
  }

  openEditStep(index: number) {
    this.editingStepIndex = index;
    this.initStepForm();
    this.stepForm.patchValue(this.steps.at(index).value);
    this.showStepDialog = true;
  }

  saveStep() {
    if (this.stepForm.invalid) return;
    const stepData = this.stepForm.value;

    if (this.editingStepIndex !== null) {
      this.steps.at(this.editingStepIndex).patchValue(stepData);
    } else {
      this.steps.push(this.fb.group({ ...stepData, order: this.steps.length }));
    }
    this.reorderSteps();
    this.showStepDialog = false;
  }

  removeStep(index: number) {
    this.steps.removeAt(index);
    this.reorderSteps();
  }

  moveStep(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.steps.length) return;
    const a = this.steps.at(index).value;
    const b = this.steps.at(newIndex).value;
    this.steps.at(index).patchValue(b);
    this.steps.at(newIndex).patchValue(a);
    this.reorderSteps();
  }

  reorderSteps() {
    this.steps.controls.forEach((ctrl, i) => ctrl.patchValue({ order: i }));
  }

  getStepTypeLabel(type: StepType): string {
    return this.stepTypes.find((s) => s.value === type)?.label ?? type;
  }

  getStepTypeIcon(type: StepType): string {
    return this.stepTypes.find((s) => s.value === type)?.icon ?? 'pi-question';
  }

  needsSelector(type: StepType): boolean {
    return [StepType.CLICK, StepType.FILL, StepType.WAIT, StepType.DOWNLOAD].includes(type);
  }

  needsValue(type: StepType): boolean {
    return type === StepType.FILL;
  }

  needsUrl(type: StepType): boolean {
    return type === StepType.NAVIGATE;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const payload: Partial<Job> = {
      name: value.name,
      description: value.description,
      targetUrl: value.targetUrl,
      downloadPath: value.downloadPath || './downloads',
      cronExpression: value.cronExpression || undefined,
      status: JobStatus.IDLE,
      steps: value.steps,
    };

    if (this.isEdit && this.jobId) {
      this.store.dispatch(JobsActions.updateJob({ id: this.jobId, job: payload }));
    } else {
      this.store.dispatch(JobsActions.createJob({ job: payload }));
    }
  }
}
