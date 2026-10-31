import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
export declare class ProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitJobProgress(event: JobProgressEvent): void;
    emitJobStatus(event: JobStatusEvent): void;
}
