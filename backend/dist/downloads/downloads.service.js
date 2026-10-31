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
exports.DownloadsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const download_entity_1 = require("../database/entities/download.entity");
let DownloadsService = class DownloadsService {
    downloadRepository;
    constructor(downloadRepository) {
        this.downloadRepository = downloadRepository;
    }
    async findAll() {
        return this.downloadRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['job'],
        });
    }
    async findOne(id) {
        const download = await this.downloadRepository.findOne({
            where: { id },
            relations: ['job'],
        });
        if (!download)
            throw new common_1.NotFoundException(`Download #${id} not found`);
        return download;
    }
    async remove(id) {
        const download = await this.findOne(id);
        await this.downloadRepository.remove(download);
    }
};
exports.DownloadsService = DownloadsService;
exports.DownloadsService = DownloadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(download_entity_1.Download)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DownloadsService);
//# sourceMappingURL=downloads.service.js.map