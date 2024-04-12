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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launcherAPI = void 0;
const Sentry = __importStar(require("@sentry/electron"));
const app_shared_1 = require("@rsilauncher/app-shared");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
Sentry.init({
    dsn: app_shared_1.configuration.sentry.dsn,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV !== 'development',
});
exports.launcherAPI = {
    log: electron_log_1.default.functions,
    authentication: {
        onSignInSuccess(args) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.signIn.USER_SIGNIN, args);
        },
        setSignOut() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.signIn.USER_SIGNOUT);
        },
    },
    notification: {
        show(options) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.notification.NATIVE_NOTIFICATION_SHOW, options);
        },
    },
    autoUpdate: {
        onUpdateError(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_ERROR, (args) => callback(args));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_ERROR);
            };
        },
        onQuitInstallError(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_QUIT_INSTALL_ERROR, (_event, update) => callback(update));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_QUIT_INSTALL_ERROR);
            };
        },
        onUpdateDownloaded(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_DOWNLOADED, (_event, update) => callback(update));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_DOWNLOADED);
            };
        },
        updateAndRestart(killGame = false) {
            electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_RESTART, { killGame });
        },
        dismissUpdate() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_UPDATE_DISMISS);
        },
        onNewVersionInstalled(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_NEW_VERSION_INSTALLED, (args) => callback(args));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.autoUpdater.AUTOUPDATER_NEW_VERSION_INSTALLED);
            };
        },
    },
    game: {
        getGlobalConfig() {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.config.GET_GLOBAL);
        },
        isGameProcessRunning() {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.launcher.LAUNCHER_IS_GAME_RUNNING);
        },
        killGameProcess(signal) {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.launcher.LAUNCHER_KILL_GAME_PROCESS, signal);
        },
        getAppPath() {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.config.GET_APP_PATH);
        },
        initializedWatcher(params) {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.gameFiles.GAME_FILES_INITIALIZE_WATCHER, params);
        },
        launchGame(settings) {
            return electron_1.ipcRenderer.send(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH, settings);
        },
        onLaunchGameSuccessfull(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH_SUCCESSFUL, (_event, args) => callback(args));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH_SUCCESSFUL);
            };
        },
        onLaunchGameFailed(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH_FAILED, (_event, error, data) => callback(error, data));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH_FAILED);
            };
        },
        onLaunchGameStopped(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH_STOPPED, (_event, data) => callback(data));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH_STOPPED);
            };
        },
    },
    installer: {
        setInstallerCancel(data, options) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.installer.INSTALLER_CANCEL, data, options);
        },
        setInstall(data) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL, data);
        },
        setInstallPause() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.installer.INSTALLER_PAUSE);
        },
        setInstallResume() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.installer.INSTALLER_RESUME);
        },
        onInstallProgress(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_PROGRESS, (_event, args) => callback(args));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_PROGRESS);
            };
        },
        onInstallSuccess(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_SUCCESSFUL, (_event, args) => callback(args));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_SUCCESSFUL);
            };
        },
        onInstallFailed(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_FAILED, (_event, error) => callback(error));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.installer.INSTALLER_INSTALL_FAILED);
            };
        },
        onCancelationSuccess(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.installer.INSTALLER_CANCEL_SUCCESSFUL, (_event) => callback());
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.installer.INSTALLER_CANCEL_SUCCESSFUL);
            };
        },
        onCancelationFailed(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.installer.INSTALLER_CANCEL_FAILED, (_event, error) => callback(error));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.installer.INSTALLER_CANCEL_FAILED);
            };
        },
        setFixPermissions(infos) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.installer.INSTALLER_FIX_PERMISSIONS, infos);
        },
        setDownloadOptions(options) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.installer.INSTALLER_SET_OPTIONS, options);
        },
        onSetDownloadOptionsSuccess(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.installer.INSTALLER_SET_OPTION_SUCCESSFUL, (_event, data) => callback(data));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.installer.INSTALLER_SET_OPTION_SUCCESSFUL);
            };
        },
    },
    settings: {
        setLibraryFolder(path) {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.library.CHANGE_LIBRARY_FOLDER, path);
        },
        openMainDialog(options) {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.dialog.SHOW_OPEN_DIALOG, options);
        },
        openLibraryFolderDialog(path) {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.dialog.SHOW_LIBRARY_FOLDER_DIALOG, path);
        },
    },
    store: {
        getValueFromStore(key) {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.store.STORE_GET, key);
        },
        setValueToStore(property, val) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.store.STORE_SET, property, val);
        },
        onSetValueToStoreSuccess(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.store.STORE_SET_SUCCESS, (_event, data) => callback(data));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.store.STORE_SET_SUCCESS);
            };
        },
        onSetValueToStoreError(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.store.STORE_SET_ERROR, (_event, data) => callback(data));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.store.STORE_SET_ERROR);
            };
        },
    },
    analytics: {
        setAnalyticsEvent(event) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT, event);
        },
        onSetAnalyticsEventSuccess(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT_SUCCESSFUL, (_event, data) => callback(data));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT_SUCCESSFUL);
            };
        },
        onSetAnalyticsEventError(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT_FAILED, (_event, data) => callback(data));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT_FAILED);
            };
        },
    },
    tray: {
        updateMenu: (item) => {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.tray.TRAY_UPDATE_MENU, item);
        },
        onMenuItemClicked(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.tray.TRAY_MENU_ITEM_CLICKED, (_event, id) => callback(id));
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.tray.TRAY_MENU_ITEM_CLICKED);
            };
        },
    },
    window: {
        isMinimized() {
            return electron_1.ipcRenderer.invoke(app_shared_1.ipcEvents.window.WINDOW_IS_MINIMIZED);
        },
        setMinimizeWindow() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.window.WINDOW_MINIMIZE);
        },
        setCloseWindow() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.window.WINDOW_CLOSE);
        },
        setSmallWindow() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.window.WINDOW_SET_SMALL);
        },
        setLargeWindow() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.window.WINDOW_SET_LARGE);
        },
        setQuitWindow() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.window.WINDOW_QUIT);
        },
        onSetCloseWindowSuccessfull() {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.window.WINDOW_QUIT_SUCCESSFUL, (callback) => callback);
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.window.WINDOW_QUIT_SUCCESSFUL);
            };
        },
        onSetHideWindowSuccessFul(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.window.WINDOW_QUIT_SUCCESSFUL, () => callback());
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.window.WINDOW_QUIT_SUCCESSFUL);
            };
        },
        onSetShowWindowSuccessFul(callback) {
            electron_1.ipcRenderer.on(app_shared_1.ipcEvents.window.WINDOW_SHOW_SUCCESSFUL, () => callback());
            return () => {
                electron_1.ipcRenderer.removeAllListeners(app_shared_1.ipcEvents.window.WINDOW_SHOW_SUCCESSFUL);
            };
        },
        setOpenInternalWindow(url, cookies, targetOptions) {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.window.WINDOW_OPEN_INTERNAL, { url, cookies, targetOptions });
        },
        setRestoreWindow() {
            electron_1.ipcRenderer.send(app_shared_1.ipcEvents.window.WINDOW_RESTORE);
        },
    },
};
electron_1.contextBridge.exposeInMainWorld('launcherAPI', exports.launcherAPI);
