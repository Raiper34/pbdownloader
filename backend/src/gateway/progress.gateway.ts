import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface JobProgressEvent {
  jobId: number;
  stepIndex: number;
  stepDescription: string;
  status: 'running' | 'success' | 'error';
  message?: string;
  totalSteps: number;
}

export interface JobStatusEvent {
  jobId: number;
  status: string;
  error?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/progress',
})
export class ProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitJobProgress(event: JobProgressEvent) {
    this.server.emit('job:progress', event);
  }

  emitJobStatus(event: JobStatusEvent) {
    this.server.emit('job:status', event);
  }
}
