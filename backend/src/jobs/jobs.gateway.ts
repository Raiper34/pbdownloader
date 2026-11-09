import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DownloadJob } from './entities/download-job.entity';

export interface JobProgressPayload {
  jobId: number;
  receivedBytes: number;
  totalBytes: number;
  percent: number | null;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/jobs',
})
export class JobsGateway {
  @WebSocketServer()
  server: Server;

  emitJobCreated(job: DownloadJob) {
    this.server.emit('job:created', job);
  }

  emitJobUpdated(job: DownloadJob) {
    this.server.emit('job:updated', job);
  }

  emitJobProgress(payload: JobProgressPayload) {
    this.server.emit('job:progress', payload);
  }
}
