import type { Response } from 'express';
import { DownloadsService } from './downloads.service';
export declare class DownloadsController {
    private readonly downloadsService;
    constructor(downloadsService: DownloadsService);
    findAll(): Promise<import("../database/entities/download.entity").Download[]>;
    findOne(id: number): Promise<import("../database/entities/download.entity").Download>;
    serveFile(id: number, res: Response): Promise<void>;
    remove(id: number): Promise<void>;
}
