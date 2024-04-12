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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Installer = void 0;
const ESU = __importStar(require("./../../eac-settings-utilities"));
const IEWS = __importStar(require("./../../install-eac-windows-service"));
const electron_1 = require("electron");
const app_shared_1 = require("@rsilauncher/app-shared");
const types_1 = require("./types");
const download_statistic_1 = require("./download-statistic");
const initial_downloader_1 = require("./initial-downloader");
const patch_installer_1 = require("./patch-installer");
const sudo_prompt_1 = require("sudo-prompt");
const fs_1 = __importDefault(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const store_1 = __importDefault(require("../../store/store"));
const execPromise = (0, util_1.promisify)(sudo_prompt_1.exec);
class Installer {
    constructor(mainWindow, gameFilesManager, resourcesPath) {
        this.executableName = 'installer-support.exe';
        this.mainWindow = mainWindow;
        this.gameFilesManager = gameFilesManager;
        this.resourcesPath = resourcesPath;
        this.installerOptions = this.initOptions();
        this.isPaused = false;
        this.runningInstaller = null;
        this.initInstallerEvents();
        this.downloadStatistics = new download_statistic_1.DownloadStatistics();
        this.patchInstaller = new patch_installer_1.PatchInstaller(this.installerOptions);
        this.initialDownloader = new initial_downloader_1.InitialDownloader(this.installerOptions);
    }
    /**
     * Init events
     */
    initInstallerEvents() {
        this.onInstall();
        this.onPause();
        this.onResume();
        this.onCancel();
        this.onSetOptions();
        this.onFixGamePermissions();
        this.initOptions();
    }
    /**
     * Attempts fixing the permissions for the game installation on a given directory
     * @param directory The directory of which to fix the permissions
     * @throws {Error}
     */
    fixPermissions(directory) {
        const installerSupportExecutable = path_1.default.resolve(this.resourcesPath, this.executableName);
        const cmd = `"${installerSupportExecutable}" --fix-library-permissions "${directory}"`;
        return execPromise(cmd);
    }
    initOptions() {
        const options = store_1.default.get('application.download');
        return Object.assign(Object.assign({}, this.installerOptions), options);
    }
    /**
     * Attempts to create directories necessary for the game installation
     * @param  {...string} directories The directories to create
     * @throws {Error}
     */
    createDirectories(...directories) {
        return __awaiter(this, void 0, void 0, function* () {
            const installerSupportExecutable = path_1.default.resolve(this.resourcesPath, this.executableName);
            const args = directories
                .filter((directory) => {
                return !fs_1.default.existsSync(directory);
            })
                .map((directory) => {
                return `--create-installation-directory "${directory}"`;
            });
            if (!args.length) {
                return;
            }
            const cmd = `"${installerSupportExecutable}" ${args.join(' ')}`;
            try {
                yield execPromise(cmd);
            }
            catch (error) {
                electron_log_1.default.error(`[Installer] - Error while attempting to create directories with command: ${cmd}, ${error}`);
            }
        });
    }
    /**
     * Return the progress of the download process depending on events
     * @param {InstallerEvents} phase Phase of the download process
     * @param {InfoStatus} info  Information concerning download (files already downloaded, total remaining)
     *
     */
    downloadProgressCallback(phase, info = { downloaded: 0, total: 0 }) {
        var _a;
        if (this.isPaused) {
            return;
        }
        if (this.mainWindow && ((_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.webContents)) {
            const progress = this.downloadStatistics.evaluateProgress(phase, info);
            if (progress !== 0.01) {
                const statistics = this.downloadStatistics.downloadStats;
                this.mainWindow.webContents.send(types_1.InstallerWithPatcherEvents.InstallProgress, {
                    phase,
                    info: Object.assign(Object.assign({}, info), { speed: statistics.lastSpeed }),
                });
            }
            this.mainWindow.setProgressBar(progress);
        }
    }
    /**
     * Events
     */
    onPause() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.installer.INSTALLER_PAUSE, () => {
            var _a, _b, _c, _d;
            if (this.isPaused) {
                return;
            }
            electron_log_1.default.info('[Installer] - Installer paused.');
            if (this.runningInstaller) {
                this.isPaused = true;
                (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.setProgressBar(this.downloadStatistics.percentProgress, { mode: 'paused' });
                if (this.runningInstaller.type === 'initial') {
                    this.initialDownloader.pause();
                }
                else {
                    this.patchInstaller.pause();
                }
                (_b = this.gameFilesManager) === null || _b === void 0 ? void 0 : _b.startFileWatcher();
                (_c = this.mainWindow) === null || _c === void 0 ? void 0 : _c.webContents.send(types_1.InstallerWithPatcherEvents.PauseSuccess);
            }
            else {
                (_d = this.mainWindow) === null || _d === void 0 ? void 0 : _d.webContents.send(types_1.InstallerWithPatcherEvents.PauseFailed);
            }
        });
    }
    onResume() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.installer.INSTALLER_RESUME, () => {
            var _a, _b, _c, _d;
            if (!this.isPaused) {
                return;
            }
            electron_log_1.default.info('[Installer] - Installer resumed.');
            if (this.runningInstaller) {
                this.isPaused = false;
                (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.setProgressBar(this.downloadStatistics.percentProgress);
                if (this.runningInstaller.type === 'initial') {
                    this.runningInstaller
                        .task()
                        // FIXME: The catch is a temporary fix for the uncaught promise rejection. This should be refactored
                        // to properly handle async tasks.
                        .catch((error) => electron_log_1.default.error('[Installer] - Error during initial installation: ', { error }));
                }
                else {
                    this.patchInstaller.resume();
                }
                const statistics = this.downloadStatistics.downloadStats;
                if (statistics) {
                    statistics.lastPeriodTime = Date.now();
                }
                (_b = this.mainWindow) === null || _b === void 0 ? void 0 : _b.webContents.send(types_1.InstallerWithPatcherEvents.ResumeSuccess);
                (_c = this.gameFilesManager) === null || _c === void 0 ? void 0 : _c.startFileWatcher();
            }
            else {
                (_d = this.mainWindow) === null || _d === void 0 ? void 0 : _d.webContents.send(types_1.InstallerWithPatcherEvents.ResumeFailed);
            }
        });
    }
    onCancel() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.installer.INSTALLER_CANCEL, (_event, data, options) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                electron_log_1.default.info('[Installer] - cancelled.');
                if (!this.runningInstaller) {
                    throw new Error('[Installer - Cancel] - There is no task running');
                }
                this.isPaused = false;
                this.downloadStatistics.percentProgress = 0;
                if (this.runningInstaller.type === 'initial') {
                    yield this.initialDownloader.cancel();
                }
                else {
                    yield this.patchInstaller.cancel();
                }
                this.runningInstaller = null;
                if (!options.keepFiles) {
                    yield this.removeFiles(data);
                }
                this.downloadProgressCallback(types_1.InstallerWithPatcherEvents.CancelSuccess);
                (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.webContents.send(types_1.InstallerWithPatcherEvents.CancelSuccess);
            }
            catch (error) {
                this.downloadProgressCallback(types_1.InstallerWithPatcherEvents.CancelFailed);
                const cancelError = new app_shared_1.CancelError('Cancellation failed due to the setup of the installer', Object.assign(Object.assign({}, data), { error }));
                (_b = this.mainWindow) === null || _b === void 0 ? void 0 : _b.webContents.send(types_1.InstallerWithPatcherEvents.CancelFailed, {
                    code: app_shared_1.InstallerErrorsNames.ERR_CANCEL_FAIL,
                    message: cancelError.message,
                    payload: data,
                    error: cancelError,
                });
            }
        }));
    }
    onSetOptions() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.installer.INSTALLER_SET_OPTIONS, (_event, data) => {
            var _a;
            electron_log_1.default.info(`[Installer] - Option: ${data.name} to ${data.value}`);
            this.installerOptions[data.name] = data.value;
            if (this.runningInstaller && !this.isPaused) {
                if (this.runningInstaller.type === 'initial') {
                    if (data.value === 0) {
                        delete this.installerOptions[data.name];
                    }
                    this.initialDownloader.setOptions();
                    setImmediate(() => {
                        if (this.runningInstaller) {
                            this.runningInstaller.task();
                        }
                    });
                }
                else {
                    this.patchInstaller.setOptions(data.name, data.value);
                }
            }
            (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.webContents.send(types_1.InstallerWithPatcherEvents.SetOptionSuccess, data);
        });
    }
    getGameServices(channelDirectory, gameName, channelId, verify) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const available = yield ESU.isAvailable(channelDirectory);
                if (!available) {
                    electron_log_1.default.info(`[Installer] - Anti Cheat files not available`);
                    return Promise.resolve();
                }
                const settings = yield ESU.readSettings(channelDirectory);
                return yield IEWS.installWindowsService({
                    gameDirectory: channelDirectory,
                    gameName,
                    environment: channelId,
                    force: verify,
                    productId: settings.productid,
                });
            }
            catch (e) {
                electron_log_1.default.error('[Installer] - Games services error', e);
            }
        });
    }
    onInstall() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL, (_event, data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (this.runningInstaller) {
                electron_log_1.default.info('[Installer] - Installer already running, ignore second install request.');
                return;
            }
            const { libraryFolder, installDir, gameId, channelId, verify, gameName, versionLabel, forcePatcher, platformId, channelName, } = data;
            const completeLibraryFolderPath = path_1.default.join(libraryFolder);
            const rootInstallationPath = path_1.default.resolve(completeLibraryFolderPath);
            const gameDirectory = path_1.default.resolve(rootInstallationPath, installDir);
            const channelDirectory = path_1.default.join(gameDirectory, channelId);
            const baseP4kUrl = data.p4kBase ? new URL(`${data.p4kBase.url}?${data.p4kBase.signatures}`) : null;
            const baseP4kVerificationFileUrl = data.p4kBaseVerificationFile
                ? new URL(`${data.p4kBaseVerificationFile.url}?${data.p4kBaseVerificationFile.signatures}`)
                : null;
            (_a = this.gameFilesManager) === null || _a === void 0 ? void 0 : _a.stopFileWatcher();
            electron_log_1.default.info(`[Installer] - ${verify ? 'Verifying' : 'Installing'} ${gameName} ${channelId} ${versionLabel} at ${gameDirectory}`);
            try {
                yield this.createDirectories(rootInstallationPath, gameDirectory, channelDirectory);
            }
            catch (e) {
                electron_log_1.default.error(`[Installer] - Error creating installation directories: ${gameDirectory}  ${channelDirectory} - ${e}`);
                const newError = new Error(`[Installer] - Error creating installation directories: ${gameDirectory}  ${channelDirectory}`);
                newError.name = 'InstallDirectoryError';
                newError.stack = `${e}`;
                return (_b = this.mainWindow) === null || _b === void 0 ? void 0 : _b.webContents.send(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_FAILED, newError);
            }
            if (verify) {
                electron_log_1.default.info(`[Installer] - Verifying permissions on ${gameDirectory}`);
                try {
                    yield this.fixPermissions(gameDirectory);
                }
                catch (e) {
                    electron_log_1.default.error(`[Installer] - Could not fix permissions on directory: ${gameDirectory}`);
                    const newError = new Error(`[Installer] - Error while verifying permissions on ${gameDirectory}`);
                    newError.name = 'FixPermissionsError';
                    newError.stack = `${e}`;
                    return (_c = this.mainWindow) === null || _c === void 0 ? void 0 : _c.webContents.send(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_FAILED, newError);
                }
            }
            if (forcePatcher) {
                electron_log_1.default.debug('[Installer] - FORCING PATCHER DOWNLOAD');
            }
            const isInitialDownload = !forcePatcher && !!baseP4kUrl && !fs_1.default.existsSync(`${channelDirectory}/Data.p4k`);
            if (forcePatcher && fs_1.default.existsSync(`${channelDirectory}/Data.p4k.part`)) {
                fs_1.default.unlinkSync(`${channelDirectory}/Data.p4k.part`);
            }
            this.downloadStatistics.downloadStats = {
                gameId,
                channelId,
                isInitialDownload,
                startTime: Date.now(),
                endTime: null,
                lastPeriodTime: Date.now(),
                lastPeriodSize: 0,
                lastSpeed: 0,
                manifest: { size: 0 },
                looseFiles: { files: 0, size: 0 },
                objectFiles: { files: 0, size: 0 },
            };
            const getInstallationTask = () => __awaiter(this, void 0, void 0, function* () {
                var _d, _e, _f, _g, _h, _j;
                try {
                    if (isInitialDownload) {
                        electron_log_1.default.info(`[Installer] - Starting download of base pack (${gameId} ${channelId} ${versionLabel}) in ${gameDirectory}`);
                        const signal = yield this.initialDownloader.download(baseP4kUrl, baseP4kVerificationFileUrl, channelDirectory, this.downloadProgressCallback.bind(this));
                        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                            electron_log_1.default.info(`[Installer] - Initial pack download aborted (${gameId} ${channelId} ${versionLabel}) in ${channelDirectory}`);
                            return;
                        }
                        electron_log_1.default.info(`[Installer] - Initial pack installed (${gameId} ${channelId} ${versionLabel}) in ${channelDirectory}`);
                    }
                    else {
                        electron_log_1.default.info(`[Installer] - Starting delta update (${gameId} (${channelId} ${versionLabel}) in ${gameDirectory}`);
                        yield this.patchInstaller.installation(channelDirectory, data.manifest, data.objects, this.downloadProgressCallback.bind(this));
                        electron_log_1.default.info(`[Installer] - Delta update applied (${gameId} ${channelId} ${versionLabel}) in ${channelDirectory}`);
                    }
                    yield this.getGameServices(channelDirectory, gameName, channelId, verify);
                    (_d = this.mainWindow) === null || _d === void 0 ? void 0 : _d.setProgressBar(-1);
                    this.runningInstaller = null;
                    const installedGameData = Object.assign(Object.assign(Object.assign({}, this.downloadStatistics.downloadStats), data), { manifest: Object.assign(Object.assign({}, this.downloadStatistics.downloadStats.manifest), data.manifest), endTime: Date.now() });
                    (_e = this.mainWindow) === null || _e === void 0 ? void 0 : _e.webContents.send(types_1.InstallerWithPatcherEvents.InstallSuccess, installedGameData);
                }
                catch (error) {
                    electron_log_1.default.error(`[Installer] - Error installing at ${channelDirectory}: ${error}`);
                    (_f = this.mainWindow) === null || _f === void 0 ? void 0 : _f.setProgressBar(-1);
                    this.runningInstaller = null;
                    const payload = {
                        gameId,
                        gameName,
                        channelId,
                        channelName,
                        platformId,
                        error,
                    };
                    if (error instanceof Error) {
                        //need to send an object of my error and serialize it back in the renderer because of this issue => https://github.com/electron/electron/issues/24427 and https://github.com/electron/electron/issues/25596;
                        (_g = this.mainWindow) === null || _g === void 0 ? void 0 : _g.webContents.send(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_FAILED, {
                            code: (_h = error.name) !== null && _h !== void 0 ? _h : app_shared_1.InstallerErrorsNames.ERR_INSTALL_UNKNOWN,
                            message: error.message,
                            payload,
                            error,
                        });
                        throw error;
                    }
                    const genericError = {
                        code: app_shared_1.InstallerErrorsNames.ERR_INSTALL_UNKNOWN,
                        message: `[Installer] - Error installing at ${channelDirectory}: ${error}`,
                        payload,
                    };
                    (_j = this.mainWindow) === null || _j === void 0 ? void 0 : _j.webContents.send(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_FAILED, genericError);
                    throw error;
                }
            });
            this.runningInstaller = {
                type: isInitialDownload ? 'initial' : 'patch',
                task: () => __awaiter(this, void 0, void 0, function* () { return yield getInstallationTask(); }),
            };
            try {
                yield getInstallationTask();
            }
            catch (error) {
                electron_log_1.default.error('[Installer] - Error: ', { error });
            }
        }));
    }
    onFixGamePermissions() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.installer.INSTALLER_FIX_PERMISSIONS, (_, data) => {
            var _a, _b;
            const { libraryFolder, installDir, channelId, gameId, gameName, channelName, platformId } = data;
            const completeLibraryFolderPath = path_1.default.join(libraryFolder);
            const rootInstallationPath = path_1.default.resolve(completeLibraryFolderPath);
            const gameDirectory = path_1.default.resolve(rootInstallationPath, installDir);
            const channelDirectory = path_1.default.join(gameDirectory, channelId);
            if (fs_1.default.existsSync(channelDirectory)) {
                try {
                    this.fixPermissions(channelDirectory);
                    (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.webContents.send(app_shared_1.ipcEvents.installer.INSTALLER_FIX_PERMISSIONS_SUCCESSFUL);
                }
                catch (error) {
                    electron_log_1.default.error(`[Installer] - Error fixing game directory permissions: ${error}`);
                    if (error instanceof Error) {
                        const payload = {
                            gameId,
                            gameName,
                            channelId,
                            channelName,
                            platformId,
                            error,
                        };
                        const permissionError = {
                            code: app_shared_1.errorsNames.ERR_FIX_PERMISSIONS,
                            message: error.message,
                            payload,
                        };
                        (_b = this.mainWindow) === null || _b === void 0 ? void 0 : _b.webContents.send(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_FAILED, permissionError);
                    }
                }
            }
        });
    }
    removeFiles(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { libraryFolder, installDir, channelId } = data;
            const completeLibraryFolderPath = path_1.default.join(libraryFolder);
            const rootInstallationPath = path_1.default.resolve(completeLibraryFolderPath);
            const gameDirectory = path_1.default.resolve(rootInstallationPath, installDir);
            const channelDirectory = path_1.default.join(gameDirectory, channelId);
            electron_log_1.default.info(`[Installer] - removing folder: ${channelDirectory}`);
            return new Promise((resolve, reject) => fs_1.default.rm(channelDirectory, { recursive: true, force: true }, (err) => {
                if (err) {
                    electron_log_1.default.error(`[Installer] - error when removing folder: ${err.message}`);
                    reject();
                    return;
                }
                electron_log_1.default.error(`[Installer] - folder removed`);
                resolve();
            }));
        });
    }
}
exports.Installer = Installer;
//# sourceMappingURL=installer.js.map