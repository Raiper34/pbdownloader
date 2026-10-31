"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const download_entity_1 = require("../database/entities/download.entity");
const job_entity_1 = require("../database/entities/job.entity");
const job_step_entity_1 = require("../database/entities/job-step.entity");
const progress_gateway_1 = require("../gateway/progress.gateway");
const jobs_controller_1 = require("./jobs.controller");
const jobs_processor_1 = require("./jobs.processor");
const jobs_service_1 = require("./jobs.service");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([job_entity_1.Job, job_step_entity_1.JobStep, download_entity_1.Download]),
            bullmq_1.BullModule.registerQueue({ name: 'jobs' }),
        ],
        controllers: [jobs_controller_1.JobsController],
        providers: [jobs_service_1.JobsService, jobs_processor_1.JobsProcessor, progress_gateway_1.ProgressGateway],
        exports: [jobs_service_1.JobsService],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map