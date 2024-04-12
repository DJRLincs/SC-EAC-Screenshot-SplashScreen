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
exports.PatchInstaller = void 0;
const cig_data_patcher_1 = require("cig-data-patcher");
const app_shared_1 = require("@rsilauncher/app-shared");
const electron_log_1 = __importDefault(require("electron-log"));
const rimraf_1 = require("rimraf");
class PatchInstaller {
    constructor(installerOptions) {
        this.installerOptions = installerOptions;
        this.dataPatcherInstaller = null;
    }
    installation(destinationDirectory, manifestInfo, objectStoreInfo, progressCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                electron_log_1.default.info('[Patch-Installer] - ************************PATCHING DOWNLOAD START');
                const logCallback = (msg) => {
                    electron_log_1.default.info(`[CigDataPatcher] - ${msg}`);
                };
                yield this.deleteEAC(destinationDirectory);
                this.dataPatcherInstaller =
                    (_a = this.dataPatcherInstaller) !== null && _a !== void 0 ? _a : new cig_data_patcher_1.Installer(cig_data_patcher_1.InstallMode.Install, destinationDirectory, { url: manifestInfo.url, suffix: `?${manifestInfo.signatures}` }, { url: objectStoreInfo.url, suffix: `?${objectStoreInfo.signatures}` }, Object.assign({ progressCallback, logCallback }, this.installerOptions));
                yield this.dataPatcherInstaller.install();
            }
            catch (error) {
                electron_log_1.default.error('[Patch-Installer] - Error:', { error });
                if (error instanceof Error) {
                    error.name = this.getPathInstallerErrorCode(error);
                    throw error;
                }
                const patcherError = new Error(`[Patch-Installer] - Error: ${error}`);
                patcherError.name = app_shared_1.PatcherErrorsNames.ERR_PATCHER_UNKNOWN;
                throw patcherError;
            }
            finally {
                this.dataPatcherInstaller = null;
            }
        });
    }
    getPathInstallerErrorCode(error) {
        var _a;
        switch (true) {
            case error.message === 'DISK IS FULL' || error.message.includes('ERR_INTERNAL:resize_file'):
                return app_shared_1.PatcherErrorsNames.ERR_DISK_FULL;
            case error.message.includes('CreateFile failed with "File not found (0x2)') ||
                error.message.includes('failed with "Access Denied (0x5)'):
                return app_shared_1.PatcherErrorsNames.ERR_WRITE_PERMISSION;
            case error.message.includes('OpenFileHandle::CreateFile failed with " The process cannot access the file because it is being used by another process (0x20)'):
                return app_shared_1.PatcherErrorsNames.ERR_FILE_IN_USE;
            case error.message.includes('retrieve_remote_file_list canceled'):
                return app_shared_1.PatcherErrorsNames.ERR_RETRIEVE_MANIFEST;
            case error.message.includes('find EndOfCentralDirectoryPosition marker'):
                return app_shared_1.PatcherErrorsNames.ERR_P4K_CORRUPTED;
            case error.message.includes('Network ERROR'):
                return app_shared_1.PatcherErrorsNames.ERR_UNKNOWN_NETWORK_ERROR;
            case error.message.includes('Chunk'):
                return app_shared_1.PatcherErrorsNames.ERR_BASE_P4K_CORRUPTED;
            case error.message.includes('Not all files were downloaded successfully'):
                return app_shared_1.PatcherErrorsNames.ERR_DOWNLOAD_UNSUCCESSFULL;
            default:
                return (_a = error.name) !== null && _a !== void 0 ? _a : app_shared_1.PatcherErrorsNames.ERR_PATCHER_UNKNOWN;
        }
    }
    deleteEAC(destinationDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            const easyAntiCheatDirectory = `${destinationDirectory}/EasyAntiCheat`;
            try {
                yield (0, rimraf_1.rimraf)(easyAntiCheatDirectory);
                electron_log_1.default.info('[Patch-Installer] - ************************EAC DIRECTORY SUCCESSFULLY DELETED');
            }
            catch (err) {
                electron_log_1.default.error('[Patch-Installer] - ************************EAC DIRECTORY FAILED TO DELETE ', err);
            }
        });
    }
    pause() {
        var _a;
        (_a = this.dataPatcherInstaller) === null || _a === void 0 ? void 0 : _a.pause();
    }
    cancel() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.dataPatcherInstaller) === null || _a === void 0 ? void 0 : _a.pause();
            (_b = this.dataPatcherInstaller) === null || _b === void 0 ? void 0 : _b.cancel();
            /**
             * We add this delay because the method "cancel" of the datapatcher
             * is async without callback. So we not able to know when the cancel have been done.
             */
            yield new Promise((resolve) => setTimeout(() => resolve('waiting done'), 3000));
            this.dataPatcherInstaller = null;
        });
    }
    resume() {
        var _a;
        (_a = this.dataPatcherInstaller) === null || _a === void 0 ? void 0 : _a.resume();
    }
    setOptions(name, value) {
        var _a;
        (_a = this.dataPatcherInstaller) === null || _a === void 0 ? void 0 : _a.setOption(name, value);
    }
}
exports.PatchInstaller = PatchInstaller;
//# sourceMappingURL=patch-installer.js.map