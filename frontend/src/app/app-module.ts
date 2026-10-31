import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

// PrimeNG v21
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Store
import { jobsReducer } from './store/jobs/jobs.reducer';
import { downloadsReducer } from './store/downloads/downloads.reducer';
import { progressReducer } from './store/progress/progress.reducer';
import { JobsEffects } from './store/jobs/jobs.effects';
import { DownloadsEffects } from './store/downloads/downloads.effects';
import { ProgressEffects } from './store/progress/progress.effects';

// Components
import { LayoutComponent } from './layout/layout.component';
import { JobsListComponent } from './features/jobs/jobs-list/jobs-list.component';
import { JobDetailComponent } from './features/jobs/job-detail/job-detail.component';
import { JobEditorComponent } from './features/job-editor/job-editor.component';
import { DownloadsComponent } from './features/downloads/downloads.component';

@NgModule({
  declarations: [
    App,
    LayoutComponent,
    JobsListComponent,
    JobDetailComponent,
    JobEditorComponent,
    DownloadsComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,

    // NgRx
    StoreModule.forRoot({
      jobs: jobsReducer,
      downloads: downloadsReducer,
      progress: progressReducer,
    }),
    EffectsModule.forRoot([JobsEffects, DownloadsEffects, ProgressEffects]),
    StoreDevtoolsModule.instrument({ maxAge: 25 }),

    // PrimeNG Modules
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    ProgressBarModule,
    PanelMenuModule,
    TooltipModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
  bootstrap: [App],
})
export class AppModule {}
