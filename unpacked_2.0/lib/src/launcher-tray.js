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
exports.LauncherTray = void 0;
const app_shared_1 = require("@rsilauncher/app-shared");
const electron_1 = require("electron");
const packageJsonFile_1 = require("./utils/packageJsonFile");
const path_1 = __importDefault(require("path"));
const analytics_1 = require("./analytics");
const isWindowsPlatform = process.platform === 'win32';
class LauncherTray {
    constructor(app, mainWindow, config) {
        this.app = app;
        this.mainWindow = mainWindow;
        this.config = config;
        this.menu = null;
        this.app = app;
        this.mainWindow = mainWindow;
        this.config = config;
        this.tray = new electron_1.Tray(this.icon);
        this.tray.setToolTip(this.config.description);
        if (isWindowsPlatform) {
            this.toggleOnClick();
        }
    }
    toggleOnClick() {
        this.tray.on('click', () => {
            if (!this.mainWindow) {
                return;
            }
            if (this.mainWindow.isVisible()) {
                if (this.mainWindow.isMinimized()) {
                    this.mainWindow.restore();
                    return;
                }
                this.mainWindow.hide();
                this.mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_HIDE_SUCCESSFUL);
            }
            else {
                this.mainWindow.show();
                this.mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_SHOW_SUCCESSFUL);
            }
        });
    }
    updateMenu(items) {
        if (this.menu !== null &&
            this.menu.items.length === items.length &&
            this.menu.items.every((item) => items.some((i) => i.id === item.id))) {
            // If the menu is already created and didn't change, we just update the items
            items.forEach(({ id, label, visible }) => {
                var _a;
                const item = (_a = this.menu) === null || _a === void 0 ? void 0 : _a.getMenuItemById(id);
                if (item) {
                    item.label = label !== null && label !== void 0 ? label : item.label;
                    item.visible = visible !== null && visible !== void 0 ? visible : item.visible;
                }
            });
        }
        else {
            // If not we (re) create it from scratch
            this.menu = electron_1.Menu.buildFromTemplate(items.map(({ id, label, visible }) => ({
                click: () => this.mainWindow.webContents.send(app_shared_1.ipcEvents.tray.TRAY_MENU_ITEM_CLICKED, id),
                id,
                label,
                visible,
            })));
            this.tray.setContextMenu(this.menu);
        }
    }
    displayBalloon(options) {
        this.tray.displayBalloon(Object.assign({ icon: this.icon }, options));
    }
    quit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.mainWindow) {
                return;
            }
            this.mainWindow.webContents.send(app_shared_1.ipcEvents.window.WINDOW_QUIT_SUCCESSFUL);
            this.mainWindow.hide();
            this.tray.destroy();
            try {
                yield (0, analytics_1.sendAnalytics)({ name: app_shared_1.AnalyticsEventName.APP_CLOSE }, this.mainWindow);
            }
            finally {
                this.app.quit();
            }
        });
    }
    get icon() {
        const iconPath = `${__dirname}/../../assets/icons/rsi${(0, packageJsonFile_1.isReleaseCandidate)() ? '-rc' : ''}`;
        // Use .ico for Windows
        if (isWindowsPlatform) {
            return path_1.default.resolve(`${iconPath}.ico`);
        }
        // Use .png for Linux and macOS (and resize it to 16x16)
        return electron_1.nativeImage.createFromPath(path_1.default.resolve(`${iconPath}.png`)).resize({ width: 16 });
    }
}
exports.LauncherTray = LauncherTray;
//# sourceMappingURL=launcher-tray.js.map