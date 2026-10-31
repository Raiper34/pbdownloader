import { Repository } from 'typeorm';
import { Download } from '../database/entities/download.entity';
export declare class DownloadsService {
    private readonly downloadRepository;
    constructor(downloadRepository: Repository<Download>);
    findAll(): Promise<Download[]>;
    findOne(id: number): Promise<Download>;
    remove(id: number): Promise<void>;
}
