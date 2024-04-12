"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LauncherNotification = void 0;
const electron_1 = require("electron");
const app_shared_1 = require("@rsilauncher/app-shared");
const packageJsonFile_1 = require("../utils/packageJsonFile");
const path_1 = __importDefault(require("path"));
class LauncherNotification {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.notificationBaseOptions = {
            icon: path_1.default.resolve(`${__dirname}/../../assets/icons/rsi${(0, packageJsonFile_1.isReleaseCandidate)() ? '-rc' : ''}.ico`),
        };
        this.onNativeNotificationShow();
    }
    onNativeNotificationShow() {
        electron_1.ipcMain.on(app_shared_1.ipcEvents.notification.NATIVE_NOTIFICATION_SHOW, (event, options) => {
            // Only show native notification if app is minimized
            if (this.mainWindow.isMinimized()) {
                this.show(options);
            }
        });
    }
    show(options) {
        const notification = new electron_1.Notification(Object.assign(Object.assign({}, this.notificationBaseOptions), options));
        notification.show();
    }
}
exports.LauncherNotification = LauncherNotification;
//# sourceMappingURL=notification.js.map