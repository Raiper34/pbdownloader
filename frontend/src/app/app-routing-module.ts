import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { JobsListComponent } from './features/jobs/jobs-list/jobs-list.component';
import { JobDetailComponent } from './features/jobs/job-detail/job-detail.component';
import { JobEditorComponent } from './features/job-editor/job-editor.component';
import { DownloadsComponent } from './features/downloads/downloads.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'jobs', pathMatch: 'full' },
      { path: 'jobs', component: JobsListComponent },
      { path: 'jobs/new', component: JobEditorComponent },
      { path: 'jobs/:id', component: JobDetailComponent },
      { path: 'jobs/:id/edit', component: JobEditorComponent },
      { path: 'downloads', component: DownloadsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
