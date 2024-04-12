"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadStatistics = void 0;
const types_1 = require("./types");
class DownloadStatistics {
    constructor() {
        this.sampleTime = 1000;
        this.singleFilePhases = [
            types_1.InstallerWithPatcherEvents.DownloadProgress,
            types_1.InstallerWithPatcherEvents.RetrieveRemoteFileListProgress,
        ];
        this.startPhases = [
            types_1.InstallerWithPatcherEvents.DownloadStart,
            types_1.InstallerWithPatcherEvents.UpdateFilesInsideP4kStart,
            types_1.InstallerWithPatcherEvents.UpdateLooseFilesStart,
            types_1.InstallerWithPatcherEvents.RetrieveRemoteFileListStart,
        ];
        this.updatePhases = [
            types_1.InstallerWithPatcherEvents.DownloadProgress,
            types_1.InstallerWithPatcherEvents.UpdateFilesInsideP4kProgress,
            types_1.InstallerWithPatcherEvents.UpdateLooseFilesProgress,
            types_1.InstallerWithPatcherEvents.RetrieveRemoteFileListProgress,
            types_1.InstallerWithPatcherEvents.UpdateP4kStructureStart,
            types_1.InstallerWithPatcherEvents.UpdateP4kStructureEnd,
        ];
        this.endPhases = [
            types_1.InstallerWithPatcherEvents.DownloadEnd,
            types_1.InstallerWithPatcherEvents.UpdateFilesInsideP4kEnd,
            types_1.InstallerWithPatcherEvents.UpdateLooseFilesEnd,
            types_1.InstallerWithPatcherEvents.RetrieveRemoteFileListEnd,
        ];
        this.downloadProgress = 0;
        this.statistics = {
            gameId: null,
            channelId: null,
            isInitialDownload: true,
            startTime: 0,
            endTime: null,
            lastPeriodTime: 0,
            lastPeriodSize: 0,
            lastSpeed: 0,
            manifest: {
                size: 0,
            },
            looseFiles: {
                size: 0,
                files: 0,
            },
            objectFiles: {
                size: 0,
                files: 0,
            },
        };
    }
    get downloadStats() {
        return this.statistics;
    }
    set downloadStats(statistics) {
        this.statistics = statistics;
    }
    get percentProgress() {
        return this.downloadProgress;
    }
    set percentProgress(val) {
        this.downloadProgress = val;
    }
    evaluateProgress(phase, info) {
        var _a, _b;
        if (this.startPhases.includes(phase)) {
            this.downloadProgress = 0.01;
        }
        if (this.updatePhases.includes(phase)) {
            const filesTotal = this.singleFilePhases.includes(phase) ? 1 : info.filesTotal;
            const valid = info.total > 0 && info.total < 100 * 1024 * 1024 * 1024 && Boolean(filesTotal);
            const downloaded = valid ? info.downloaded : 0;
            const total = valid ? info.total : 0;
            this.downloadProgress = valid ? downloaded / total : 0;
            if (valid) {
                const period = Date.now() - this.statistics.lastPeriodTime;
                if (period >= this.sampleTime) {
                    const periodDownloaded = downloaded - this.statistics.lastPeriodSize;
                    this.statistics.lastPeriodTime = Date.now();
                    this.statistics.lastPeriodSize = downloaded;
                    this.statistics.lastSpeed = (periodDownloaded * 1000) / period;
                }
            }
            if (phase === types_1.InstallerWithPatcherEvents.RetrieveRemoteFileListProgress && info.total > 0) {
                this.statistics.manifest.size = info.total;
            }
            if (phase === types_1.InstallerWithPatcherEvents.UpdateLooseFilesProgress && info.total > 0) {
                this.statistics.looseFiles.size = info.total;
                this.statistics.looseFiles.files = (_a = info.filesTotal) !== null && _a !== void 0 ? _a : 0;
            }
            if (phase === types_1.InstallerWithPatcherEvents.UpdateFilesInsideP4kProgress && info.total > 0) {
                this.statistics.objectFiles.size = info.total;
                this.statistics.objectFiles.files = (_b = info.filesTotal) !== null && _b !== void 0 ? _b : 0;
            }
            if (phase === types_1.InstallerWithPatcherEvents.DownloadProgress) {
                this.downloadProgress = info.downloaded / info.total;
            }
            if (this.endPhases.includes(phase)) {
                this.downloadProgress = -1;
            }
        }
        return this.downloadProgress;
    }
}
exports.DownloadStatistics = DownloadStatistics;
//# sourceMappingURL=download-statistic.js.map