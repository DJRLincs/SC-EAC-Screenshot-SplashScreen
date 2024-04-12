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
exports.RsiBrowserWindow = exports.WINDOW_LARGE_MAX_DIMENSIONS = exports.WINDOW_LARGE_MIN_DIMENSIONS = exports.WINDOW_LARGE_DIMENSIONS = exports.WINDOW_SMALL_DIMENSIONS = void 0;
const app_shared_1 = require("@rsilauncher/app-shared");
const electron_1 = require("electron");
const electron_util_1 = require("../../electron-util");
const helper_1 = require("./helper");
const electron_log_1 = __importDefault(require("electron-log"));
const url_1 = require("url");
const analytics_1 = require("../../analytics");
const store_1 = __importDefault(require("../../store/store"));
const packageJsonFile_1 = require("../../utils/packageJsonFile");
const rsi_internal_window_1 = require("./rsi-internal-window");
exports.WINDOW_SMALL_DIMENSIONS = [1024, 768];
exports.WINDOW_LARGE_DIMENSIONS = [1440, 900];
exports.WINDOW_LARGE_MIN_DIMENSIONS = [1024, 768];
exports.WINDOW_LARGE_MAX_DIMENSIONS = [2560, 1440];
class RsiBrowserWindow {
    constructor(mainWindow, gameLauncher, systemTray) {
        this.mainWindowSize = 'small';
        this.resizeDelay = 250;
        this.windowOptions = {
            width: 1380,
            height: 750,
            autoHideMenuBar: true,
            backgroundColor: '#1c2737',
            icon: `assets/icons/rsi${(0, packageJsonFile_1.isReleaseCandidate)() ? '-rc' : ''}.ico`,
            webPreferences: {
                partition: 'rsi',
            },
        };
        this.setWindowCookies = (url, cookies, window) => __awaiter(this, void 0, void 0, function* () {
            if (cookies.length === 0) {
                return false;
            }
            const urlParsed = new url_1.URL(url);
            const baseUrl = `${urlParsed.protocol}//${urlParsed.hostname}`;
            const decorateCookie = (cookie) => ({
                url: baseUrl,
                name: cookie.name,
                value: cookie.value,
                domain: urlParsed.hostname,
                path: '/',
            });
            const sessionCookies = window.webContents.session.cookies;
            // Existing cookies are removed because we may have duplicates between environments.
            const existingCookies = (yield Promise.all(cookies.map((cookie) => sessionCookies.get({ name: cookie.name })))).flat();
            if (existingCookies.length > 0) {
                yield Promise.all(existingCookies.map((existingCookie) => (0, electron_util_1.removeCookie)(sessionCookies, baseUrl, existingCookie.name)));
            }
            yield (0, electron_util_1.setCookies)(sessionCookies, cookies.map((cookie) => decorateCookie(cookie)));
            return true;
        });
        this.mainWindow = mainWindow;
        this.gameLauncher = gameLauncher;
        this.systemTray = systemTray;
        this.initWindowsEvents();
    }
    /**
     * Init all events to sync windows events with renderer
     */
    initWindowsEvents() {
        this.openInternalWindow();
        this.openExternalWindow();
        this.minimizeMainWindow();
        this.isWindowMinimized();
        this.restoreMainWindow();
        this.closeMainWindow();
        this.quitMainWindow();
        this.hideMainWindow();
        this.showMainWindow();
        this.setLargeWindow();
        this.setSmallWindow();
        this.saveBounds();
    }
    openInternalWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_OPEN_INTERNAL, (event, data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const options = this.windowOptions;
                const { url, cookies, targetOptions } = data;
                const { target, reload } = targetOptions || { reload: true };
                let isNewWindow = false;
                let window = (0, helper_1.retrieveExistingWindowByTarget)(target);
                if (!window) {
                    window = new rsi_internal_window_1.RsiInternalWindow(options);
                    (0, helper_1.saveExistingWindow)(target, window);
                    isNewWindow = true;
                }
                // @ts-ignore
                yield this.setWindowCookies(url, cookies, window);
                // await setCookies(window.webContents.session.cookies, cookies);
                if (isNewWindow || reload) {
                    window.loadURL(url);
                }
                window.focus();
            }
            catch (error) {
                electron_log_1.default.error(error);
            }
        }));
    }
    openExternalWindow() {
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (!(0, helper_1.shouldNavigateToURL)(url) && (0, helper_1.isSafeToOpenURL)(url)) {
                electron_1.shell.openExternal(url);
            }
            return { action: 'deny' };
        });
    }
    hideMainWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_HIDE, () => {
            this.mainWindow.hide();
            this.mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_HIDE_SUCCESSFUL);
        });
    }
    showMainWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_SHOW, () => {
            var _a, _b;
            (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.show();
            (_b = this.mainWindow) === null || _b === void 0 ? void 0 : _b.webContents.send(app_shared_1.ipcEvents.window.WINDOW_SHOW_SUCCESSFUL);
        });
    }
    quitMainWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_QUIT, () => {
            if (this.gameLauncher && this.gameLauncher.isGameRunning) {
                this.gameLauncher.kill('SIGTERM');
            }
            if (this.mainWindow && this.mainWindow.webContents) {
                this.mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_QUIT_SUCCESSFUL);
                this.mainWindow.hide();
            }
            this.systemTray.quit();
        });
    }
    closeMainWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_CLOSE, () => {
            const shouldQuit = store_1.default.get('quitOnWindowClose');
            if (!shouldQuit) {
                this.mainWindow.hide();
                this.mainWindow.webContents.setAudioMuted(true);
                this.mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_HIDE_SUCCESSFUL);
                return;
            }
            if (this.gameLauncher && this.gameLauncher.isGameRunning) {
                this.gameLauncher.kill('SIGTERM');
            }
            if (this.mainWindow && this.mainWindow.webContents) {
                this.mainWindow.hide();
                this.mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_QUIT_SUCCESSFUL);
                (0, analytics_1.sendAnalytics)({ name: app_shared_1.AnalyticsEventName.APP_CLOSE }, this.mainWindow);
            }
            this.systemTray.quit();
        });
    }
    minimizeMainWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_MINIMIZE, () => {
            var _a;
            (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.minimize();
        });
    }
    isWindowMinimized() {
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.window.WINDOW_IS_MINIMIZED, () => {
            var _a;
            return (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.isMinimized();
        });
    }
    restoreMainWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_RESTORE, () => {
            this.mainWindow.webContents.setAudioMuted(false);
            if (!this.mainWindow.isVisible()) {
                this.mainWindow.show();
            }
            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.setAlwaysOnTop(true);
            this.mainWindow.focus();
            this.mainWindow.setAlwaysOnTop(false);
        });
    }
    getWindowState() {
        const [windowWidth, windowHeight] = this.mainWindowSize !== 'small' ? exports.WINDOW_LARGE_DIMENSIONS : exports.WINDOW_SMALL_DIMENSIONS;
        const defaultWindowState = {
            width: windowWidth,
            height: windowHeight,
        };
        const storedBounds = store_1.default.get(`application.window.${this.mainWindowSize}.bounds`);
        if (!storedBounds) {
            return defaultWindowState;
        }
        //Get the screen area that was previously used for launcher
        const screenArea = electron_1.screen.getDisplayMatching(storedBounds).workArea;
        // Check if the window isnt in the screen and/or cannot feat in.
        if (storedBounds.x > screenArea.x + screenArea.width ||
            storedBounds.x < screenArea.x ||
            storedBounds.y < screenArea.y ||
            storedBounds.y > screenArea.y + screenArea.height) {
            // Reset window into existing screenarea
            return defaultWindowState;
        }
        return this.mainWindowSize !== 'small'
            ? storedBounds
            : Object.assign(Object.assign({}, storedBounds), { width: windowWidth, height: windowHeight });
    }
    saveWindowBounds() {
        var _a;
        const newBounds = (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.getBounds();
        store_1.default.set(`application.window.${this.mainWindowSize}.bounds`, newBounds);
    }
    saveBounds() {
        this.mainWindow.on('move', () => {
            this.saveWindowBounds();
        });
        this.mainWindow.on('close', () => {
            this.saveWindowBounds();
        });
    }
    setLargeWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_SET_LARGE, (_event, _data) => {
            if (this.mainWindow && this.mainWindowSize !== 'large') {
                this.mainWindowSize = 'large';
                const [windowMinWidth, windowMinHeight] = exports.WINDOW_LARGE_MIN_DIMENSIONS;
                const [windowMaxWidth, windowMaxHeight] = exports.WINDOW_LARGE_MAX_DIMENSIONS;
                const windowState = this.getWindowState();
                const { width, height } = windowState;
                this.mainWindow.hide();
                // Note that there is actually a bug on electron side
                // https://github.com/electron/electron/issues/13043
                this.mainWindow.setBounds(windowState);
                this.mainWindow.setSize(width !== null && width !== void 0 ? width : windowMinWidth, height !== null && height !== void 0 ? height : windowMinHeight);
                this.mainWindow.setResizable(true);
                this.mainWindow.setMinimumSize(windowMinWidth, windowMinHeight);
                this.mainWindow.setMaximumSize(windowMaxWidth, windowMaxHeight);
                setTimeout(() => {
                    if (!windowState.x) {
                        this.mainWindow.center();
                    }
                    this.mainWindow.show();
                }, this.resizeDelay);
            }
        });
    }
    setSmallWindow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.window.WINDOW_SET_SMALL, (_event, _data) => {
            if (this.mainWindow && this.mainWindowSize !== 'small') {
                this.mainWindowSize = 'small';
                const [smallWindowWidth, smallWindowHeight] = exports.WINDOW_SMALL_DIMENSIONS;
                const windowState = this.getWindowState();
                this.mainWindow.hide();
                // Note that there is actually a bug on electron side
                // https://github.com/electron/electron/issues/13043
                this.mainWindow.setSize(smallWindowWidth, smallWindowHeight);
                this.mainWindow.setMinimumSize(smallWindowWidth, smallWindowHeight);
                this.mainWindow.setMaximumSize(smallWindowWidth, smallWindowHeight);
                this.mainWindow.setBounds(windowState);
                this.mainWindow.setResizable(process.platform === 'darwin' || false); // Resizable on macOS, whatever the window size.
                setTimeout(() => {
                    if (!windowState.x) {
                        this.mainWindow.center();
                    }
                    this.mainWindow.show();
                }, this.resizeDelay);
            }
        });
    }
}
exports.RsiBrowserWindow = RsiBrowserWindow;
//# sourceMappingURL=rsi-browser-window.js.map