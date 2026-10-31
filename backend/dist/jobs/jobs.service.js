"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_2 = require("bullmq");
const typeorm_2 = require("typeorm");
const job_entity_1 = require("../database/entities/job.entity");
const job_step_entity_1 = require("../database/entities/job-step.entity");
let JobsService = class JobsService {
    jobRepository;
    jobStepRepository;
    jobQueue;
    constructor(jobRepository, jobStepRepository, jobQueue) {
        this.jobRepository = jobRepository;
        this.jobStepRepository = jobStepRepository;
        this.jobQueue = jobQueue;
    }
    async findAll() {
        return this.jobRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const job = await this.jobRepository.findOne({
            where: { id },
            relations: ['steps'],
        });
        if (!job)
            throw new common_1.NotFoundException(`Job #${id} not found`);
        return job;
    }
    async create(dto) {
        const job = this.jobRepository.create({
            ...dto,
            status: job_entity_1.JobStatus.IDLE,
            downloadPath: dto.downloadPath ?? './downloads',
        });
        return this.jobRepository.save(job);
    }
    async update(id, dto) {
        const job = await this.findOne(id);
        const { steps, ...jobFields } = dto;
        Object.assign(job, jobFields);
        await this.jobRepository.save(job);
        if (steps !== undefined) {
            await this.jobStepRepository.delete({ jobId: id });
            const newSteps = steps.map((stepDto) => this.jobStepRepository.create({ ...stepDto, jobId: id }));
            await this.jobStepRepository.save(newSteps);
        }
        return this.findOne(id);
    }
    async remove(id) {
        const job = await this.findOne(id);
        await this.jobRepository.remove(job);
    }
    async enqueue(id) {
        const job = await this.findOne(id);
        if (job.status === job_entity_1.JobStatus.RUNNING || job.status === job_entity_1.JobStatus.QUEUED) {
            throw new Error(`Job #${id} is already running or queued`);
        }
        job.status = job_entity_1.JobStatus.QUEUED;
        await this.jobRepository.save(job);
        await this.jobQueue.add('run-job', { jobId: id }, { jobId: `job-${id}-${Date.now()}` });
        return job;
    }
    async updateStatus(id, status, error) {
        const update = { status };
        if (error)
            update.lastError = error;
        if (status === job_entity_1.JobStatus.RUNNING)
            update.lastRunAt = new Date();
        await this.jobRepository.update(id, update);
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_entity_1.Job)),
    __param(1, (0, typeorm_1.InjectRepository)(job_step_entity_1.JobStep)),
    __param(2, (0, bullmq_1.InjectQueue)('jobs')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        bullmq_2.Queue])
], JobsService);
//# sourceMappingURL=jobs.service.js.map