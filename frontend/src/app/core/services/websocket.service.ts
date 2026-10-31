import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { JobStatusEvent, ProgressEvent } from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: Socket;
  private progressSubject = new Subject<ProgressEvent>();
  private statusSubject = new Subject<JobStatusEvent>();

  constructor() {
    this.socket = io('/progress', { transports: ['websocket', 'polling'], path: '/socket.io' });
    this.socket.on('job:progress', (event: ProgressEvent) => this.progressSubject.next(event));
    this.socket.on('job:status', (event: JobStatusEvent) => this.statusSubject.next(event));
  }

  onJobProgress(): Observable<ProgressEvent> {
    return this.progressSubject.asObservable();
  }

  onJobStatus(): Observable<JobStatusEvent> {
    return this.statusSubject.asObservable();
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
