"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialDownloader = void 0;
const types_1 = require("./types");
const app_shared_1 = require("@rsilauncher/app-shared");
const stream_1 = require("stream");
const cig_data_patcher_1 = require("cig-data-patcher");
const errors_1 = require("node-multi-downloader/dist/mdFile/errors");
const node_multi_downloader_1 = __importDefault(require("node-multi-downloader"));
const fs_1 = __importDefault(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
const path_1 = __importDefault(require("path"));
class InitialDownloader {
    constructor(installerOptions) {
        this.chunkSize = 20 * 1024 * 1024;
        this.defaultRetriesChunkDownload = 10;
        /**
         * Check size of files for download and retrieve them
         * @param {URL} initialDownloadUrl
         * @param {URL} hashUrl
         * @param {string} destination
         */
        this.createInitialDownload = (initialDownloadUrl, hashUrl, destination) => __awaiter(this, void 0, void 0, function* () {
            try {
                const verificationHeader = yield this.retrieveInitialDownloadVerificationFile(hashUrl);
                if (verificationHeader) {
                    electron_log_1.default.info(`[Initial-Download] - Verification header found for initial download: Filename: ${verificationHeader.file.name} FileSize: ${verificationHeader.file.size}`);
                }
                else {
                    electron_log_1.default.error('[Initial-Download] - Verification header not found for initial download');
                    const error = new Error('[Initial-Download] - Verification header not found for initial download');
                    error.name = 'VerificationHeaderError';
                    throw error;
                }
                const { size } = verificationHeader.file;
                const defaultConfig = {
                    chunkSize: this.chunkSize,
                    noResize: true,
                    retries: this.defaultRetriesChunkDownload,
                    rateLimit: this.installerOptions.maximumDownloadBandwidth,
                    concurrentDownloads: this.installerOptions.concurrentTransfers,
                };
                const config = Object.assign({ verificationHeader }, defaultConfig);
                try {
                    yield cig_data_patcher_1.Installer.createEmptySparseFile(destination, size);
                }
                catch (error) {
                    if (fs_1.default.existsSync(destination)) {
                        fs_1.default.unlinkSync(destination);
                    }
                }
                return yield node_multi_downloader_1.default.create(destination, initialDownloadUrl, config);
            }
            catch (error) {
                electron_log_1.default.error('[Initial-download] - createInitialDownload error', { error });
                throw error;
            }
        });
        this.installerOptions = installerOptions;
        this.nodeMultiDownloaderInstaller = null;
    }
    /**
     * Attempts to retrieve the verification file for the initial download
     * @param  {string} verificationFileUrl the url of the verification file
     */
    retrieveInitialDownloadVerificationFile(verificationFileUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!verificationFileUrl) {
                return Promise.resolve(null);
            }
            try {
                const stream = yield Promise.race([
                    node_multi_downloader_1.default.retrieveContent(verificationFileUrl),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Could not retrieve the verification file within 5 seconds')), 5000)),
                ]);
                const isReadable = (stream) => {
                    return stream instanceof stream_1.Readable;
                };
                if (!isReadable(stream)) {
                    return Promise.resolve(null);
                }
                return new Promise((resolve, reject) => {
                    let result = '';
                    stream.on('data', (buffer) => {
                        result += buffer.toString();
                    });
                    stream.on('end', () => resolve(JSON.parse(result.trim())));
                    stream.on('error', () => reject(Error(result)));
                });
            }
            catch (error) {
                electron_log_1.default.error(`[InitialDownload Error] - verification download files failed: ${error}`);
                return Promise.resolve(null);
            }
        });
    }
    download(url, verificationFileURL, destinationDirectory, progressCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.info('[Initial-Download] - Initial download start');
            const initialP4kName = 'Data.p4k.part';
            const destinationP4kPath = path_1.default.join(destinationDirectory, initialP4kName);
            const finalP4kPath = path_1.default.join(destinationDirectory, 'Data.p4k');
            const isNewDownload = !fs_1.default.existsSync(destinationP4kPath);
            const onProgress = (stream) => stream.on('data', (info) => {
                const newInfo = {
                    downloaded: info.alreadyDownloaded + info.downloaded,
                    total: info.total,
                };
                progressCallback(types_1.InstallerWithPatcherEvents.DownloadProgress, newInfo);
            });
            progressCallback(types_1.InstallerWithPatcherEvents.DownloadStart);
            const downloadOptions = 'maximumDownloadBandwidth' in this.installerOptions
                ? { rateLimit: this.installerOptions.maximumDownloadBandwidth }
                : {};
            if (!verificationFileURL) {
                return Promise.resolve(null);
            }
            const callDownload = isNewDownload
                ? yield this.createInitialDownload(url, verificationFileURL, destinationP4kPath)
                : yield node_multi_downloader_1.default.open(destinationP4kPath, { url });
            this.nodeMultiDownloaderInstaller =
                (_a = this.nodeMultiDownloaderInstaller) !== null && _a !== void 0 ? _a : new node_multi_downloader_1.default(callDownload, onProgress, downloadOptions);
            const [promise, , signal] = this.nodeMultiDownloaderInstaller.isPaused
                ? this.nodeMultiDownloaderInstaller.resume()
                : this.nodeMultiDownloaderInstaller.install();
            try {
                yield promise;
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === 'InvalidMDFileHeader') {
                        electron_log_1.default.info('[Initial-Download] - Invalid MDFile Header, p4k is possibly complete but was not renamed properly');
                        return null;
                    }
                    if (error instanceof errors_1.InvalidMDFileError) {
                        electron_log_1.default.error(`[Initial-Download] - Invalid MDFile, p4k is corrupted`, error);
                        this.removeInitialDownload(destinationP4kPath, finalP4kPath);
                    }
                    error.name = this.getInitialInstallerErrorCode(error);
                    throw error;
                }
                const initialDownloadError = new Error(`[Initial-Download] - Error: ${error}`);
                initialDownloadError.name = app_shared_1.InitialDownloadErrorsNames.ERR_INIT_UNKNOWN;
                throw initialDownloadError;
            }
            finally {
                if (!signal.aborted) {
                    yield this.nodeMultiDownloaderInstaller.close();
                    this.nodeMultiDownloaderInstaller = null;
                    if (fs_1.default.existsSync(destinationP4kPath)) {
                        fs_1.default.renameSync(destinationP4kPath, finalP4kPath);
                    }
                    electron_log_1.default.info('[Initial-Download] - Initial download done');
                    progressCallback(types_1.InstallerWithPatcherEvents.DownloadEnd);
                }
            }
            return signal;
        });
    }
    getInitialInstallerErrorCode(error) {
        var _a;
        switch (true) {
            case error instanceof errors_1.InvalidMDFileError:
                return app_shared_1.InitialDownloadErrorsNames.ERR_INVALID_MD_FILE;
            default:
                return (_a = error.name) !== null && _a !== void 0 ? _a : app_shared_1.InitialDownloadErrorsNames.ERR_INIT_UNKNOWN;
        }
    }
    removeInitialDownload(destinationP4kPath, finalP4kPath) {
        try {
            electron_log_1.default.info(`[Initial-Download] - Removing initial download`);
            if (fs_1.default.existsSync(finalP4kPath)) {
                fs_1.default.unlinkSync(finalP4kPath);
            }
            if (fs_1.default.existsSync(destinationP4kPath)) {
                fs_1.default.unlinkSync(destinationP4kPath);
            }
        }
        catch (error) {
            electron_log_1.default.error(`[Initial-Download] - Error when deleting base pack:  ${error.message}`);
        }
    }
    pause() {
        var _a;
        (_a = this.nodeMultiDownloaderInstaller) === null || _a === void 0 ? void 0 : _a.pause();
    }
    cancel() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.nodeMultiDownloaderInstaller) === null || _a === void 0 ? void 0 : _a.isPaused)) {
                (_b = this.nodeMultiDownloaderInstaller) === null || _b === void 0 ? void 0 : _b.pause();
            }
            yield ((_c = this.nodeMultiDownloaderInstaller) === null || _c === void 0 ? void 0 : _c.close());
            this.nodeMultiDownloaderInstaller = null;
        });
    }
    setOptions() {
        var _a, _b;
        (_a = this.nodeMultiDownloaderInstaller) === null || _a === void 0 ? void 0 : _a.pause();
        const downloadOptions = {
            rateLimit: this.installerOptions.maximumDownloadBandwidth,
            concurrentDownloads: this.installerOptions.concurrentTransfers,
        };
        (_b = this.nodeMultiDownloaderInstaller) === null || _b === void 0 ? void 0 : _b.setOptions(downloadOptions);
    }
}
exports.InitialDownloader = InitialDownloader;
//# sourceMappingURL=initial-downloader.js.map