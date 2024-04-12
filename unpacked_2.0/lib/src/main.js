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
const Sentry = __importStar(require("@sentry/electron/main"));
const globalConfig = __importStar(require("./global-config"));
const app_shared_1 = require("@rsilauncher/app-shared");
const electron_1 = require("electron");
const logger_1 = require("./logger");
const check_minimum_requirements_1 = require("./check-minimum-requirements");
const auto_update_1 = __importDefault(require("./auto-update"));
const context_menu_1 = require("./services/context-menu");
const dialog_1 = __importDefault(require("./services/dialog/dialog"));
const game_files_manager_1 = __importDefault(require("./game-files-manager"));
const game_launcher_1 = require("./game-launcher");
const notification_1 = require("./services/notification");
const launcher_tray_1 = require("./launcher-tray");
const rsi_browser_window_1 = require("./services/window/rsi-browser-window");
const types_1 = require("./services/status/types");
const shortcut_1 = require("./services/shortcut");
const basic_auth_login_1 = require("./basic-auth-login");
const fs_1 = __importDefault(require("fs"));
const check_vcredist_1 = __importDefault(require("./check-vcredist"));
const electron_log_1 = __importDefault(require("electron-log"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const analytics_1 = require("./analytics");
const store_1 = __importDefault(require("./store/store"));
const isWindowsPlatform = process.platform === 'win32';
let patcherVersion = 'unknown';
let InstallerService = null;
let cpuCapabilities = null;
// lazy load cig-data-patcher, installer service and @cig/cpu-features
// to avoid loading them if current process is not running on windows
// and avoid errors on other platforms
if (isWindowsPlatform) {
    Promise.resolve().then(() => __importStar(require('cig-data-patcher'))).then((module) => {
        patcherVersion = module.patcherVersion;
    });
    Promise.resolve().then(() => __importStar(require('./services/installer/installer'))).then((module) => {
        InstallerService = module.Installer;
    });
    Promise.resolve().then(() => __importStar(require('@cig/cpu-features'))).then((module) => {
        cpuCapabilities = module.default();
    });
}
Sentry.init({
    dsn: app_shared_1.configuration.sentry.dsn,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV !== 'development',
});
try {
    const DEFAULT_LIBRARY_FOLDER_PATH = app_shared_1.configuration.infoApp.defaultLibraryPath;
    const USER_AGENT = `${electron_1.app.getName()}-${electron_1.app.getVersion()}`;
    const AUTO_UPDATER_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
    const debugMode = !!(process.argv.find((arg) => arg === '--debug') && true);
    const isDev = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    const pkg = fs_1.default.readFileSync(`${__dirname}/../../package.json`, 'utf8');
    const { description, version: launcherVersion, configuration: pkgConfiguration } = JSON.parse(pkg);
    const cfg = {
        description,
        configuration: app_shared_1.configuration,
        environment: isTest ? 'qah3' : pkgConfiguration.environment,
        launcherVersion,
        patcherVersion,
        osMetMinimumRequirements: (0, check_minimum_requirements_1.respectMinimumWindowsVersion)(os_1.default.release()),
        cpuMetRequirements: (0, check_minimum_requirements_1.respectCPUCapabilites)(cpuCapabilities),
        appPath: electron_1.app.getAppPath(),
        identity: null,
    };
    electron_1.app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');
    const rsiEnvSchemes = Object.keys(app_shared_1.configuration.env).map((envName) => `${types_1.Scheme.RSI}+${envName}`);
    const allRsiSchemes = [types_1.Scheme.RSI, ...rsiEnvSchemes, types_1.Scheme.STATUS];
    const customSchemes = allRsiSchemes.map((scheme) => ({
        scheme,
        privileges: { bypassCSP: true, supportFetchAPI: true, corsEnabled: true },
    }));
    electron_1.protocol.registerSchemesAsPrivileged([{ scheme: 'file' }, ...customSchemes]);
    (0, logger_1.setupLogger)({ level: debugMode || process.env.NODE_ENV === 'development' ? 'debug' : 'info' });
    let { resourcesPath } = process;
    if (isDev) {
        resourcesPath = path_1.default.resolve(__dirname, '../../');
    }
    let mainWindow;
    let systemTray;
    let gameLauncher;
    let gameFilesManager;
    const handleDeepLink = (argv) => {
        const deeplinkingUrl = argv.find((arg) => arg.startsWith('rsilauncher://'));
        if (deeplinkingUrl) {
            systemTray.displayBalloon({
                title: `Deep link to ${deeplinkingUrl}`,
                content: deeplinkingUrl,
            });
        }
    };
    const focusWindow = (window) => {
        if (isDev) {
            return;
        }
        window.setAlwaysOnTop(true);
        window.focus();
        window.setAlwaysOnTop(false);
    };
    if (isDev) {
        const jsFileArg = process.argv.find((arg) => arg.endsWith('.js'));
        if (jsFileArg) {
            const jsFilePath = path_1.default.resolve(jsFileArg);
            electron_log_1.default.info(`Registering rsilauncher protocol handler with execPath ${process.execPath}
                and entry point ${jsFilePath}`);
            electron_1.app.setAsDefaultProtocolClient('rsilauncher', process.execPath, [path_1.default.resolve(jsFilePath)]);
        }
        else {
            electron_log_1.default.error('Did not register as rsilauncher protocol handler ' +
                'because no path to a javascript file was found in the process arguments');
        }
    }
    const shouldQuit = !electron_1.app.requestSingleInstanceLock();
    electron_1.app.on('second-instance', (e, argv) => {
        handleDeepLink(argv);
        if (mainWindow) {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
                mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_SHOW_SUCCESSFUL);
            }
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            focusWindow(mainWindow);
        }
    });
    if (shouldQuit) {
        electron_1.app.quit();
    }
    const createWindow = () => {
        const config = {
            productName: app_shared_1.configuration.infoApp.appName,
            submitURL: app_shared_1.configuration.sentry.minidumpUrl,
            uploadToServer: true,
            globalExtra: {
                _companyName: app_shared_1.configuration.infoApp.companyName,
            },
        };
        electron_1.crashReporter.start(config);
        mainWindow = new electron_1.BrowserWindow({
            title: electron_1.app.getName(),
            show: false,
            resizable: process.platform === 'darwin' || false,
            frame: false,
            center: true,
            backgroundColor: '#0a1d29',
            transparent: false,
            webPreferences: {
                devTools: isDev || debugMode,
                preload: path_1.default.resolve(__dirname, './../', 'src/preload.js'),
                experimentalFeatures: true,
                sandbox: false,
            },
        });
        // This is being executed with ts-dist as the working directory so we need to reefr
        // to the index file in the parent directory.
        // TODO: Find a better solution for this, maybe change the CWD of the electron process
        // to be the root of the project instead of ts-build
        const indexFilePath = electron_1.app.isPackaged || isTest
            ? `file://${path_1.default.resolve(__dirname, './../../', 'app/index.html')}`
            : 'http://localhost:3000';
        mainWindow.loadURL(indexFilePath);
        mainWindow.once('ready-to-show', () => {
            if (mainWindow) {
                mainWindow.show();
                focusWindow(mainWindow);
            }
        });
        mainWindow.on('show', () => {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.setAudioMuted(false);
        });
        const filter = {
            urls: [
                '*://robertsspaceindustries.com/*',
                '*://*.robertsspaceindustries.com/*',
                '*://*.cloudimperiumgames.com/*',
                '*://cloudimperiumgames.com/*',
                '*://*.local.dev/*',
            ],
        };
        if (isDev) {
            filter.urls.push('*://*.turbulent.ca/*');
        }
        mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            details.requestHeaders['User-Agent'] = USER_AGENT; // eslint-disable-line no-param-reassign
            delete details.requestHeaders.Cookie; // eslint-disable-line no-param-reassign
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });
        /* Prevent dropping items on the application from navigating. */
        mainWindow.webContents.on('will-navigate', (e) => {
            e.preventDefault();
        });
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
        return mainWindow;
    };
    const createWindowForEnv = () => {
        if (isDev || debugMode) {
            const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS,
            // eslint-disable-next-line global-require
             } = require('electron-devtools-installer');
            const extensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];
            const installExtensions = () => Promise.all(extensions.map((extensionName) => installExtension(extensionName)));
            return installExtensions()
                .catch((err) => electron_log_1.default.warn(`Could not install extension: ${err}`))
                .then(() => createWindow())
                .finally(() => {
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.openDevTools({ mode: 'undocked' });
            });
        }
        const window = createWindow();
        return Promise.resolve(window);
    };
    // protocol.registerSchemesAsPrivileged([  ]);
    const apiProtocolFactory = (scheme) => {
        const schemeLen = scheme.length;
        const envSeparatorIdx = scheme.indexOf('+');
        const envName = envSeparatorIdx >= 0 ? scheme.substr(scheme.indexOf('+') + 1) : cfg.environment;
        // @ts-ignore
        const { apiUrl } = envName && app_shared_1.configuration.env[envName] ? app_shared_1.configuration.env[envName] : { apiUrl: '<not-set>' };
        const passwordRegexp = /("password")+(:)+(".+")/gm;
        if (scheme === types_1.Scheme.STATUS) {
            return (request, callback) => {
                electron_log_1.default.debug({ statusRequest: `${app_shared_1.configuration.statusUrl}/${request.url.slice(schemeLen + 3)}.json` });
                callback({
                    method: request.method,
                    referrer: request.referrer,
                    url: `${app_shared_1.configuration.statusUrl}/${request.url.slice(schemeLen + 3)}.json`,
                });
            };
        }
        // eslint-disable-next-line no-unused-vars
        return (request, callback) => {
            const resourcePath = request.url.slice(schemeLen + 3);
            const redirectPath = `${apiUrl}/${resourcePath}`;
            let uploadData;
            if (request.uploadData && request.uploadData.length > 0) {
                const payloadStr = request.uploadData[0].bytes.toString();
                uploadData = {
                    contentType: 'application/json',
                    data: payloadStr,
                };
            }
            // Hide all data containing password as key
            const logUploadData = Object.assign(Object.assign({}, uploadData), { data: uploadData === null || uploadData === void 0 ? void 0 : uploadData.data.replace(passwordRegexp, '"password":"<HIDDEN>"') });
            electron_log_1.default.info(`[API] - request: ${redirectPath}`);
            electron_log_1.default.debug(`[API] - payload: ${JSON.stringify(logUploadData)}`);
            callback({
                method: request.method,
                referrer: request.referrer,
                url: redirectPath,
                uploadData,
            });
        };
    };
    electron_1.app.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
        mainWindow = yield createWindowForEnv();
        handleDeepLink(process.argv);
        if (isWindowsPlatform) {
            electron_1.app.setAppUserModelId(electron_1.app.getName());
            if (InstallerService) {
                new InstallerService(mainWindow, gameFilesManager, resourcesPath);
            }
        }
        globalConfig.initializeInstance(cfg);
        globalConfig.getInstance().cpuMetRequirements = (0, check_minimum_requirements_1.respectCPUCapabilites)(cpuCapabilities);
        systemTray = new launcher_tray_1.LauncherTray(electron_1.app, mainWindow, { description });
        gameLauncher = new game_launcher_1.GameLauncher(mainWindow);
        new notification_1.LauncherNotification(mainWindow);
        new context_menu_1.ContextMenu(mainWindow);
        new dialog_1.default(mainWindow);
        new shortcut_1.Shortcut(mainWindow, isDev || debugMode);
        const autoUpdate = new auto_update_1.default(mainWindow, electron_1.app, gameLauncher, AUTO_UPDATER_CHECK_INTERVAL);
        autoUpdate.start();
        const RsiWindow = new rsi_browser_window_1.RsiBrowserWindow(mainWindow, gameLauncher, systemTray);
        const windowState = RsiWindow.getWindowState();
        mainWindow.setBounds(windowState);
        (0, analytics_1.sendAnalytics)({ name: app_shared_1.AnalyticsEventName.APP_OPEN }, mainWindow).then(() => electron_log_1.default.info('[Analytics] event sent : application open'));
        if (isWindowsPlatform) {
            (0, check_vcredist_1.default)();
        }
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.on('restore', () => {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.setAudioMuted(false);
        });
        electron_1.ipcMain.on(app_shared_1.ipcEvents.launcher.LAUNCHER_LAUNCH, (event, data) => {
            gameFilesManager === null || gameFilesManager === void 0 ? void 0 : gameFilesManager.stopFileWatcher();
            gameLauncher.start(data);
        });
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.launcher.LAUNCHER_IS_GAME_RUNNING, (event) => {
            // eslint-disable-next-line no-param-reassign
            return gameLauncher.isGameRunning;
        });
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.launcher.LAUNCHER_KILL_GAME_PROCESS, (event, signal) => __awaiter(void 0, void 0, void 0, function* () {
            gameLauncher.kill(signal);
            gameFilesManager === null || gameFilesManager === void 0 ? void 0 : gameFilesManager.startFileWatcher();
            // Notify the client of the current state at start up
            const gameFilesState = yield gameFilesManager.getGameFilesState();
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send(app_shared_1.ipcEvents.gameFiles.GAME_FILES_CHANGED, gameFilesState);
        }));
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.launcher.LAUNCHER_GET_RELEASE_OBJECT, (event, params) => {
            return gameLauncher.getGameClientReleaseObject(params);
        });
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.gameFiles.GAME_FILES_INITIALIZE_WATCHER, (event, data) => __awaiter(void 0, void 0, void 0, function* () {
            const { libraryFolder, channelId, installDir } = data;
            const gamePath = path_1.default.resolve(libraryFolder, installDir, channelId);
            // If watcher already exists, update path instead of invoke a new watcher
            if (gameFilesManager) {
                gameFilesManager.setGamePath(libraryFolder, gamePath);
            }
            else {
                gameFilesManager = new game_files_manager_1.default(libraryFolder, gamePath);
                gameFilesManager.startFileWatcher();
            }
            gameFilesManager.on('game-files-changed', (filesState) => {
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send(app_shared_1.ipcEvents.gameFiles.GAME_FILES_CHANGED, filesState);
            });
            // Notify the client of the current state at start up
            const gameFilesState = yield gameFilesManager.getGameFilesState();
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send(app_shared_1.ipcEvents.gameFiles.GAME_FILES_CHANGED, gameFilesState);
        }));
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.gameFiles.GAME_FILES_REMOVE_USER_FOLDER, (event, { deleteKeyBindings }) => __awaiter(void 0, void 0, void 0, function* () {
            yield gameFilesManager.deleteUserFolderForChannel(deleteKeyBindings);
            // Notify the client of the current state at start up
            const gameFilesState = yield gameFilesManager.getGameFilesState();
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send(app_shared_1.ipcEvents.gameFiles.GAME_FILES_CHANGED, gameFilesState);
        }));
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.gameFiles.GAME_FILES_REMOVE_SHADERS_FOLDER, () => __awaiter(void 0, void 0, void 0, function* () {
            yield gameFilesManager.deleteShadersFolderForChannel();
        }));
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.gameFiles.GAME_FILES_CHECK_USER_FOLDER_EXISTS, () => __awaiter(void 0, void 0, void 0, function* () {
            return gameFilesManager.userFolderExists();
        }));
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.gameFiles.GAME_FILES_CHECK_SHADERS_FOLDER_EXISTS, () => __awaiter(void 0, void 0, void 0, function* () {
            return gameFilesManager.shadersFolderExists();
        }));
        electron_1.ipcMain.handle(app_shared_1.ipcEvents.library.CHANGE_LIBRARY_FOLDER, (event, data) => {
            try {
                gameFilesManager === null || gameFilesManager === void 0 ? void 0 : gameFilesManager.setLibraryFolder(data);
            }
            catch (e) {
                electron_log_1.default.error('An error occured while picking directory folder, ', e);
            }
        });
        electron_1.ipcMain.on(app_shared_1.ipcEvents.signIn.USER_SIGNIN, (event, data) => {
            const { accountName, heapAccountId, trackingMetricsId } = data;
            globalConfig.getInstance().identity = { accountName, heapAccountId, trackingMetricsId };
            (0, analytics_1.sendAnalytics)({ name: app_shared_1.AnalyticsEventName.APP_SIGNEDIN }, mainWindow).then(() => electron_log_1.default.info('[Analytics] event sent : user is signed in'));
        });
        electron_1.ipcMain.on(app_shared_1.ipcEvents.signIn.USER_SIGNOUT, () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, analytics_1.sendAnalytics)({ name: app_shared_1.AnalyticsEventName.APP_SIGNEDOUT }, mainWindow).then(() => electron_log_1.default.info('[Analytics] event sent : user is signed out'));
            globalConfig.getInstance().identity = null;
        }));
    }));
    electron_1.app.whenReady().then(() => {
        allRsiSchemes.forEach((envScheme) => {
            const successfullyRegistered = electron_1.protocol.registerHttpProtocol(envScheme, apiProtocolFactory(envScheme));
            if (!successfullyRegistered) {
                electron_log_1.default.error(`Unable to register HTTP protocol handler for scheme "${envScheme}}"`);
            }
        });
    });
    electron_1.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
    electron_1.app.on('login', (0, basic_auth_login_1.basicAuthLogin)({ directory: resourcesPath, filename: 'credentials.json' }));
    electron_1.ipcMain.handle(app_shared_1.ipcEvents.config.GET_GLOBAL, () => {
        return globalConfig.getInstance();
    });
    electron_1.ipcMain.handle(app_shared_1.ipcEvents.config.GET_APP_PATH, () => {
        return isDev ? DEFAULT_LIBRARY_FOLDER_PATH : path_1.default.dirname(path_1.default.dirname(path_1.default.dirname(electron_1.app.getAppPath())));
    });
    electron_1.ipcMain.on(app_shared_1.ipcEvents.tray.TRAY_UPDATE_MENU, (_event, data) => {
        systemTray.updateMenu(data);
    });
    electron_1.app.on('will-quit', () => {
        if (gameLauncher) {
            gameLauncher.removeAllLoginData();
        }
    });
    electron_1.ipcMain.on(app_shared_1.ipcEvents.logger.LOGGER_LOG_EVENT, (event, { name, data }) => {
        (0, logger_1.logEvent)(name, data);
    });
    electron_1.ipcMain.on(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT, (event, { name, data }) => {
        (0, analytics_1.sendAnalytics)({ name, data }, mainWindow)
            .then(() => {
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT_SUCCESSFUL);
            }
        })
            .catch((error) => {
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send(app_shared_1.ipcEvents.analytics.ANALYTICS_SEND_EVENT_FAILED, {
                    name: error.name,
                    message: error.message,
                });
            }
        });
    });
    //STORE EVENT
    electron_1.ipcMain.handle(app_shared_1.ipcEvents.store.STORE_GET, (event, val) => {
        try {
            const result = store_1.default.get(val);
            return result;
        }
        catch (error) {
            electron_log_1.default.error(`The store couldnt get the value: ${val}: ${error}`);
            return error;
        }
    });
    electron_1.ipcMain.on(app_shared_1.ipcEvents.store.STORE_SET, (event, key, val) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            store_1.default.set(key, val);
            event.reply(app_shared_1.ipcEvents.store.STORE_SET_SUCCESS, { key, val });
        }
        catch (error) {
            electron_log_1.default.error(`The store couldnt save the value: ${val}: ${error}`);
            event.reply(app_shared_1.ipcEvents.store.STORE_SET_ERROR, { key, val });
        }
    }));
}
catch (error) {
    electron_log_1.default.error(error);
}
//# sourceMappingURL=main.js.map