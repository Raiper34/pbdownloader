import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    findAll(): Promise<import("../database/entities/job.entity").Job[]>;
    findOne(id: number): Promise<import("../database/entities/job.entity").Job>;
    create(dto: CreateJobDto): Promise<import("../database/entities/job.entity").Job>;
    update(id: number, dto: UpdateJobDto): Promise<import("../database/entities/job.entity").Job>;
    remove(id: number): Promise<void>;
    run(id: number): Promise<import("../database/entities/job.entity").Job>;
}
