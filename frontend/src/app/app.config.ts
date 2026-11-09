import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';
import { routes } from './app.routes';
import { downloadersReducer } from './store/downloaders/downloaders.reducer';
import { jobsReducer } from './store/jobs/jobs.reducer';
import * as DownloadersEffects from './store/downloaders/downloaders.effects';
import * as JobsEffects from './store/jobs/jobs.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Lara } }),
    provideStore({
      downloaders: downloadersReducer,
      jobs: jobsReducer,
    }),
    provideEffects([DownloadersEffects, JobsEffects]),
    provideStoreDevtools({ maxAge: 25 }),
  ],
};
