"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var JobsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const typeorm_2 = require("typeorm");
const download_entity_1 = require("../database/entities/download.entity");
const job_step_entity_1 = require("../database/entities/job-step.entity");
const job_entity_1 = require("../database/entities/job.entity");
const progress_gateway_1 = require("../gateway/progress.gateway");
const jobs_service_1 = require("./jobs.service");
let JobsProcessor = JobsProcessor_1 = class JobsProcessor extends bullmq_1.WorkerHost {
    jobsService;
    progressGateway;
    jobRepository;
    downloadRepository;
    logger = new common_1.Logger(JobsProcessor_1.name);
    constructor(jobsService, progressGateway, jobRepository, downloadRepository) {
        super();
        this.jobsService = jobsService;
        this.progressGateway = progressGateway;
        this.jobRepository = jobRepository;
        this.downloadRepository = downloadRepository;
    }
    async process(bullJob) {
        const { jobId } = bullJob.data;
        const job = await this.jobsService.findOne(jobId);
        this.logger.log(`Starting job #${jobId}: ${job.name}`);
        await this.jobsService.updateStatus(jobId, job_entity_1.JobStatus.RUNNING);
        this.progressGateway.emitJobStatus({ jobId, status: job_entity_1.JobStatus.RUNNING });
        const downloadDir = path.resolve(job.downloadPath);
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }
        let browser = null;
        try {
            browser = await puppeteer_1.default.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            const cdpSession = await page.createCDPSession();
            await cdpSession.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: downloadDir,
            });
            const filesBefore = fs.existsSync(downloadDir)
                ? new Set(fs.readdirSync(downloadDir))
                : new Set();
            const sortedSteps = [...job.steps].sort((a, b) => a.order - b.order);
            for (let i = 0; i < sortedSteps.length; i++) {
                const step = sortedSteps[i];
                this.progressGateway.emitJobProgress({
                    jobId,
                    stepIndex: i,
                    stepDescription: step.description || `${step.type} step`,
                    status: 'running',
                    totalSteps: sortedSteps.length,
                });
                try {
                    await this.executeStep(page, step, downloadDir);
                    this.progressGateway.emitJobProgress({
                        jobId,
                        stepIndex: i,
                        stepDescription: step.description || `${step.type} step`,
                        status: 'success',
                        totalSteps: sortedSteps.length,
                    });
                }
                catch (stepError) {
                    const msg = stepError instanceof Error ? stepError.message : String(stepError);
                    this.progressGateway.emitJobProgress({
                        jobId,
                        stepIndex: i,
                        stepDescription: step.description || `${step.type} step`,
                        status: 'error',
                        message: msg,
                        totalSteps: sortedSteps.length,
                    });
                    throw stepError;
                }
            }
            await this.waitForDownloads(downloadDir, 60000);
            if (fs.existsSync(downloadDir)) {
                const filesAfter = new Set(fs.readdirSync(downloadDir));
                for (const file of filesAfter) {
                    if (!filesBefore.has(file)) {
                        const filePath = path.join(downloadDir, file);
                        const stat = fs.statSync(filePath);
                        await this.downloadRepository.save(this.downloadRepository.create({
                            jobId,
                            filename: file,
                            filePath,
                            fileSize: stat.size,
                        }));
                        this.logger.log(`Registered download: ${file}`);
                    }
                }
            }
            await this.jobsService.updateStatus(jobId, job_entity_1.JobStatus.COMPLETED);
            this.progressGateway.emitJobStatus({ jobId, status: job_entity_1.JobStatus.COMPLETED });
            this.logger.log(`Job #${jobId} completed`);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Job #${jobId} failed: ${msg}`);
            await this.jobsService.updateStatus(jobId, job_entity_1.JobStatus.FAILED, msg);
            this.progressGateway.emitJobStatus({ jobId, status: job_entity_1.JobStatus.FAILED, error: msg });
            throw error;
        }
        finally {
            if (browser)
                await browser.close();
        }
    }
    async executeStep(page, step, downloadDir) {
        const timeout = step.timeout ?? 30000;
        switch (step.type) {
            case job_step_entity_1.StepType.NAVIGATE:
                await page.goto(step.url, { waitUntil: 'networkidle2', timeout });
                break;
            case job_step_entity_1.StepType.CLICK:
                await page.waitForSelector(step.selector, { timeout });
                await page.click(step.selector);
                break;
            case job_step_entity_1.StepType.FILL:
                await page.waitForSelector(step.selector, { timeout });
                await page.click(step.selector, { clickCount: 3 });
                await page.type(step.selector, step.value ?? '');
                break;
            case job_step_entity_1.StepType.WAIT:
                if (step.selector) {
                    await page.waitForSelector(step.selector, { timeout });
                }
                else {
                    await new Promise((r) => setTimeout(r, timeout));
                }
                break;
            case job_step_entity_1.StepType.DOWNLOAD: {
                const downloadPromise = new Promise((resolve) => {
                    const interval = setInterval(() => {
                        if (fs.existsSync(downloadDir)) {
                            const files = fs.readdirSync(downloadDir).filter((f) => !f.endsWith('.crdownload'));
                            if (files.length > 0) {
                                clearInterval(interval);
                                resolve();
                            }
                        }
                    }, 500);
                    setTimeout(() => {
                        clearInterval(interval);
                        resolve();
                    }, timeout);
                });
                await page.waitForSelector(step.selector, { timeout });
                await page.click(step.selector);
                await downloadPromise;
                break;
            }
            case job_step_entity_1.StepType.SCREENSHOT: {
                const screenshotPath = path.join(downloadDir, `screenshot-${Date.now()}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                break;
            }
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }
    waitForDownloads(downloadDir, timeout) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!fs.existsSync(downloadDir)) {
                    clearInterval(interval);
                    resolve();
                    return;
                }
                const pending = fs.readdirSync(downloadDir).filter((f) => f.endsWith('.crdownload'));
                if (pending.length === 0) {
                    clearInterval(interval);
                    resolve();
                }
            }, 500);
            setTimeout(() => {
                clearInterval(interval);
                resolve();
            }, timeout);
        });
    }
};
exports.JobsProcessor = JobsProcessor;
exports.JobsProcessor = JobsProcessor = JobsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('jobs'),
    __param(2, (0, typeorm_1.InjectRepository)(job_entity_1.Job)),
    __param(3, (0, typeorm_1.InjectRepository)(download_entity_1.Download)),
    __metadata("design:paramtypes", [jobs_service_1.JobsService,
        progress_gateway_1.ProgressGateway,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JobsProcessor);
//# sourceMappingURL=jobs.processor.js.map