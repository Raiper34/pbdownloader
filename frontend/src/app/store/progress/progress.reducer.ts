import { createReducer, on } from '@ngrx/store';
import { JobStatus, ProgressEvent } from '../../core/models/job.model';
import * as ProgressActions from './progress.actions';

export interface ProgressStep extends ProgressEvent {
  timestamp: number;
}

export interface ProgressState {
  activeJobId: number | null;
  steps: ProgressStep[];
  jobStatus: JobStatus | null;
  lastError: string | null;
}

export const initialState: ProgressState = {
  activeJobId: null,
  steps: [],
  jobStatus: null,
  lastError: null,
};

export const progressReducer = createReducer(
  initialState,

  on(ProgressActions.startWatchingJob, (state, { jobId }) => ({
    ...state,
    activeJobId: jobId,
    steps: [],
    jobStatus: null,
    lastError: null,
  })),

  on(ProgressActions.jobProgressReceived, (state, { event }) => {
    if (state.activeJobId !== event.jobId) return state;
    const steps = [...state.steps];
    const existing = steps.findIndex((s) => s.stepIndex === event.stepIndex);
    const step: ProgressStep = { ...event, timestamp: Date.now() };
    if (existing >= 0) steps[existing] = step;
    else steps.push(step);
    return { ...state, steps };
  }),

  on(ProgressActions.jobStatusReceived, (state, { event }) => {
    if (state.activeJobId !== event.jobId) return state;
    return { ...state, jobStatus: event.status, lastError: event.error ?? null };
  }),

  on(ProgressActions.clearProgress, () => initialState),
  on(ProgressActions.stopWatchingJob, (state) => ({ ...state, activeJobId: null })),
);
