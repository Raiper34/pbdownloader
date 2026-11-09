import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/download/download.component').then((m) => m.DownloadComponent),
  },
  {
    path: 'downloaders',
    loadComponent: () =>
      import('./pages/downloaders/downloaders.component').then((m) => m.DownloadersComponent),
  },
  { path: '**', redirectTo: '' },
];
