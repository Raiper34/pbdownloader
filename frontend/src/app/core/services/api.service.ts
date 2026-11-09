import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Downloader, CreateDownloaderRequest } from '../models/downloader.model';
import { DownloadJob, CreateJobRequest } from '../models/job.model';
import { JobLog } from '../models/job-log.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getDownloaders(): Observable<Downloader[]> {
    return this.http.get<Downloader[]>(`${API_BASE}/downloaders`);
  }

  getDownloader(id: number): Observable<Downloader> {
    return this.http.get<Downloader>(`${API_BASE}/downloaders/${id}`);
  }

  createDownloader(data: CreateDownloaderRequest): Observable<Downloader> {
    return this.http.post<Downloader>(`${API_BASE}/downloaders`, data);
  }

  updateDownloader(id: number, data: Partial<CreateDownloaderRequest>): Observable<Downloader> {
    return this.http.put<Downloader>(`${API_BASE}/downloaders/${id}`, data);
  }

  deleteDownloader(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/downloaders/${id}`);
  }

  exportDownloader(id: number): Observable<object> {
    return this.http.get<object>(`${API_BASE}/downloaders/${id}/export`);
  }

  importDownloader(data: object): Observable<Downloader> {
    return this.http.post<Downloader>(`${API_BASE}/downloaders/import`, data);
  }

  getJobs(): Observable<DownloadJob[]> {
    return this.http.get<DownloadJob[]>(`${API_BASE}/jobs`);
  }

  getJob(id: number): Observable<DownloadJob> {
    return this.http.get<DownloadJob>(`${API_BASE}/jobs/${id}`);
  }

  createJob(data: CreateJobRequest): Observable<DownloadJob> {
    return this.http.post<DownloadJob>(`${API_BASE}/jobs`, data);
  }

  retryJob(id: number): Observable<DownloadJob> {
    return this.http.post<DownloadJob>(`${API_BASE}/jobs/${id}/retry`, {});
  }

  cancelJob(id: number): Observable<DownloadJob> {
    return this.http.post<DownloadJob>(`${API_BASE}/jobs/${id}/cancel`, {});
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/jobs/${id}`);
  }

  getJobDownloadUrl(id: number): string {
    return `${API_BASE}/jobs/${id}/download`;
  }

  getJobScreenshotUrl(id: number): string {
    return `${API_BASE}/jobs/${id}/screenshot`;
  }

  getJobHtmlUrl(id: number): string {
    return `${API_BASE}/jobs/${id}/html`;
  }

  getJobLogs(jobId: number): Observable<JobLog[]> {
    return this.http.get<JobLog[]>(`${API_BASE}/jobs/${jobId}/logs`);
  }

  getJobLogScreenshotUrl(jobId: number, logId: number): string {
    return `${API_BASE}/jobs/${jobId}/logs/${logId}/screenshot`;
  }
}
