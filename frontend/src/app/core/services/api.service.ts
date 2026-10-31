import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Download } from '../models/download.model';
import { Job } from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  // Jobs
  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.base}/jobs`);
  }

  getJob(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.base}/jobs/${id}`);
  }

  createJob(job: Partial<Job>): Observable<Job> {
    return this.http.post<Job>(`${this.base}/jobs`, job);
  }

  updateJob(id: number, job: Partial<Job>): Observable<Job> {
    return this.http.put<Job>(`${this.base}/jobs/${id}`, job);
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/jobs/${id}`);
  }

  runJob(id: number): Observable<Job> {
    return this.http.post<Job>(`${this.base}/jobs/${id}/run`, {});
  }

  // Downloads
  getDownloads(): Observable<Download[]> {
    return this.http.get<Download[]>(`${this.base}/downloads`);
  }

  deleteDownload(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/downloads/${id}`);
  }

  getDownloadFileUrl(id: number): string {
    return `${this.base}/downloads/${id}/file`;
  }
}
