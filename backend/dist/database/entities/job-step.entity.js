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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStep = exports.StepType = void 0;
const typeorm_1 = require("typeorm");
const job_entity_1 = require("./job.entity");
var StepType;
(function (StepType) {
    StepType["NAVIGATE"] = "navigate";
    StepType["CLICK"] = "click";
    StepType["FILL"] = "fill";
    StepType["WAIT"] = "wait";
    StepType["DOWNLOAD"] = "download";
    StepType["SCREENSHOT"] = "screenshot";
})(StepType || (exports.StepType = StepType = {}));
let JobStep = class JobStep {
    id;
    jobId;
    job;
    order;
    type;
    selector;
    value;
    url;
    timeout;
    description;
};
exports.JobStep = JobStep;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], JobStep.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], JobStep.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_entity_1.Job, (job) => job.steps, { onDelete: 'CASCADE' }),
    __metadata("design:type", job_entity_1.Job)
], JobStep.prototype, "job", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], JobStep.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], JobStep.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], JobStep.prototype, "selector", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], JobStep.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], JobStep.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], JobStep.prototype, "timeout", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], JobStep.prototype, "description", void 0);
exports.JobStep = JobStep = __decorate([
    (0, typeorm_1.Entity)('job_steps')
], JobStep);
//# sourceMappingURL=job-step.entity.js.map