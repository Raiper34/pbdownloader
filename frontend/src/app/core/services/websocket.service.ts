import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { DownloadJob, JobProgress } from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private socket: Socket;
  private jobCreated$ = new Subject<DownloadJob>();
  private jobUpdated$ = new Subject<DownloadJob>();
  private jobProgress$ = new Subject<JobProgress>();

  constructor() {
    this.socket = io('/jobs', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    this.socket.on('job:created', (job: DownloadJob) => {
      this.jobCreated$.next(job);
    });

    this.socket.on('job:updated', (job: DownloadJob) => {
      this.jobUpdated$.next(job);
    });

    this.socket.on('job:progress', (progress: JobProgress) => {
      this.jobProgress$.next(progress);
    });
  }

  onJobCreated(): Observable<DownloadJob> {
    return this.jobCreated$.asObservable();
  }

  onJobUpdated(): Observable<DownloadJob> {
    return this.jobUpdated$.asObservable();
  }

  onJobProgress(): Observable<JobProgress> {
    return this.jobProgress$.asObservable();
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
    this.jobCreated$.complete();
    this.jobUpdated$.complete();
    this.jobProgress$.complete();
  }
}
