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
const app_shared_1 = require("@rsilauncher/app-shared");
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const compare_versions_1 = __importDefault(require("compare-versions"));
const electron_log_1 = __importDefault(require("electron-log"));
const package_json_1 = __importDefault(require("../package.json"));
const store_1 = __importDefault(require("./store/store"));
var AutoUpdaterEvents;
(function (AutoUpdaterEvents) {
    AutoUpdaterEvents["Error"] = "error";
    AutoUpdaterEvents["Login"] = "login";
    AutoUpdaterEvents["CheckingForUpdate"] = "checking-for-update";
    AutoUpdaterEvents["UpdateNotAvailable"] = "update-not-available";
    AutoUpdaterEvents["UpdateAvailable"] = "update-available";
    AutoUpdaterEvents["UpdateDownloaded"] = "update-downloaded";
    AutoUpdaterEvents["DownloadProgress"] = "download-progress";
    AutoUpdaterEvents["UpdateCancelled"] = "update-cancelled";
    AutoUpdaterEvents["AppImageFilenameUpdated"] = "appimage-filename-update";
})(AutoUpdaterEvents || (AutoUpdaterEvents = {}));
// Hook electron-updater to electron-log
electron_updater_1.autoUpdater.logger = electron_log_1.default;
// Enable auto-update server for local environment
if (process.env.NODE_ENV === 'development') {
    electron_updater_1.autoUpdater.channel = 'local';
    electron_updater_1.autoUpdater.forceDevUpdateConfig = true;
    electron_updater_1.autoUpdater.allowDowngrade = true;
}
class AutoUpdate {
    constructor(window, app, gameLauncher, checkInterval = 10 * 60 * 1000) {
        this.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        this.checkForUpdateLoop = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield electron_updater_1.autoUpdater.checkForUpdates();
                if (!this.updateInProgress) {
                    yield this.delay(this.checkInterval);
                    this.checkForUpdateLoop();
                }
            }
            catch (e) {
                electron_log_1.default.info('[AutoUpdate::checkForUpdateLoop] - Error while checking for latest launcher update: ', e);
                yield this.delay(this.checkInterval);
                this.checkForUpdateLoop();
            }
        });
        this.isNewVersionInstalled = () => {
            if (compare_versions_1.default.compare(package_json_1.default.version, store_1.default.get('application.version'), '>')) {
                electron_log_1.default.info('[AutoUpdate::isNewVersionInstalled] - New version has been installed: ', package_json_1.default.version);
                // notify renderer that the new version has been installed
                this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_NEW_VERSION_INSTALLED);
            }
            // update store
            store_1.default.set('application.version', package_json_1.default.version);
        };
        this.updateInProgress = false;
        this.previousUpdateFailed = process.argv.includes(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_QUIT_INSTALL_ERROR);
        this.checkInterval = checkInterval;
        this.window = window;
        this.app = app;
        this.gameLauncher = gameLauncher;
        this.initAutoUpdaterEvents();
    }
    /**
     * Init all events to sync electron-updater with renderer
     */
    initAutoUpdaterEvents() {
        this.onError();
        this.onCheckingForUpdates();
        this.onUpdateAvailable();
        this.onUpdateNotAvailable();
        this.onDownloadProgress();
        this.onUpdateDownloaded();
        this.onUpdateRestart();
        this.onUpdateDismiss();
    }
    onError() {
        electron_updater_1.autoUpdater.on(AutoUpdaterEvents.Error, (err) => {
            electron_log_1.default.error('[AutoUpdate] - Error occured auto-updating: ', err);
            // reset state of icon progress bar
            this.window.setProgressBar(-1);
            this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_ERROR, err);
            // Catch case where install and restart failed
            // Since electron-updater doesn't provide callback
            // we need to relaunch the launcher with args in order to catch it
            // on next restart and warn the user about the failure
            if (this.updateInProgress) {
                this.app.relaunch({ args: [app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_QUIT_INSTALL_ERROR] });
            }
        });
    }
    onCheckingForUpdates() {
        electron_updater_1.autoUpdater.on(AutoUpdaterEvents.CheckingForUpdate, () => this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_CHECKING_FOR_UPDATE));
    }
    onUpdateAvailable() {
        electron_updater_1.autoUpdater.on(AutoUpdaterEvents.UpdateAvailable, (updateInfo) => {
            const { version } = updateInfo;
            electron_log_1.default.info(`[AutoUpdate::onUpdateAvailable] - Launcher update available (${version})`);
            this.updateInProgress = true;
            this.window.setProgressBar(0.01);
            this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_AVAILABLE, updateInfo);
        });
    }
    onUpdateNotAvailable() {
        electron_updater_1.autoUpdater.on(AutoUpdaterEvents.UpdateNotAvailable, () => this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_NOT_AVAILABLE));
    }
    onDownloadProgress() {
        electron_updater_1.autoUpdater.on(AutoUpdaterEvents.DownloadProgress, (progressInfo) => {
            const percentProgress = progressInfo.percent > 0 ? progressInfo.percent / 100 : 0.01;
            this.window.setProgressBar(percentProgress);
            this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_DOWNLOAD_PROGRESS, progressInfo);
        });
    }
    onUpdateDownloaded() {
        electron_updater_1.autoUpdater.on(AutoUpdaterEvents.UpdateDownloaded, (updateInfo) => {
            const { version } = updateInfo;
            this.window.setProgressBar(-1);
            if (this.previousUpdateFailed) {
                electron_log_1.default.info(`[AutoUpdate::onUpdateDownloaded] - Launcher install failed (${version})`);
                return this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_QUIT_INSTALL_ERROR, {
                    updateInfo,
                    state: app_shared_1.AutoUpdateDialogStates.ERROR,
                });
            }
            if (this.gameLauncher.isGameRunning) {
                electron_log_1.default.info(`[AutoUpdate::onUpdateDownloaded] - Launcher install game is running (${version})`);
                return this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_DOWNLOADED, {
                    updateInfo,
                    state: app_shared_1.AutoUpdateDialogStates.QUIT_GAME,
                });
            }
            electron_log_1.default.info(`[AutoUpdate::onUpdateDownloaded] - Launcher update downloaded (${version})`);
            this.window.webContents.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_DOWNLOADED, {
                updateInfo,
                state: app_shared_1.AutoUpdateDialogStates.AVAILABLE,
            });
        });
    }
    onUpdateRestart() {
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_RESTART, (_event, { killGame }) => __awaiter(this, void 0, void 0, function* () {
            this.updateInProgress = true;
            electron_log_1.default.info('[AutoUpdate::onUpdateRestart] - Quitting and installing latest launcher update');
            if (killGame) {
                try {
                    yield this.gameLauncher.kill();
                    electron_log_1.default.info('[AutoUpdate::onUpdateRestart] - Game has been killed');
                }
                catch (e) {
                    electron_log_1.default.info('[AutoUpdate::onUpdateRestart] - Error while killing game', e);
                }
            }
            const isInstalled = electron_updater_1.autoUpdater.quitAndInstall(false, true);
            electron_log_1.default.info(`[AutoUpdate::onUpdateRestart] - isInstalled ${isInstalled}`);
        }));
    }
    onUpdateDismiss() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_DISMISS, () => {
            electron_log_1.default.info('[AutoUpdate::onUpdateDismiss] - Update has been dismissed');
            this.updateInProgress = false;
        });
    }
    start() {
        return this.delay(2000)
            .then(this.isNewVersionInstalled)
            .then(this.checkForUpdateLoop)
            .catch((e) => electron_log_1.default.error('[AutoUpdate::start] - Error while starting AutoUpdate: ', e));
    }
    checkNow() {
        return electron_updater_1.autoUpdater.checkForUpdates();
    }
}
exports.default = AutoUpdate;
//# sourceMappingURL=auto-update.js.map