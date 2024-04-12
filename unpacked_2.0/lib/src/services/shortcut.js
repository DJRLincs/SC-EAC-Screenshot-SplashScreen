"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shortcut = void 0;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const store_1 = __importDefault(require("../store/store"));
class Shortcut {
    constructor(mainWindow, debugMode) {
        this.mainWindow = mainWindow;
        this.debugMode = debugMode;
        this.registerShortcuts();
    }
    registerShortcuts() {
        this.mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.alt && input.shift && input.key.toLowerCase() === 'i') {
                this.executeCtrlAltShiftI();
            }
            if (input.control && input.shift && input.key.toLowerCase() === 'r') {
                this.executeCtrlShiftR();
            }
            if (input.control && input.shift && input.alt && input.key.toLowerCase() === 'r') {
                this.executeCtrlAltShiftR();
            }
        });
    }
    executeCtrlAltShiftI() {
        var _a;
        if (this.debugMode) {
            electron_log_1.default.info('CommandOrControl+Alt+Shift+I is pressed');
            (_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.webContents.openDevTools({ mode: 'undocked' });
        }
    }
    executeCtrlShiftR() {
        electron_log_1.default.info('CommandOrControl+Shift+R is pressed');
        store_1.default.set('library.defaults', []);
        electron_1.app.relaunch();
        electron_1.app.exit();
    }
    executeCtrlAltShiftR() {
        electron_log_1.default.info('CommandOrControl+Alt+Shift+R is pressed');
        store_1.default.clear();
        electron_1.app.relaunch();
        electron_1.app.exit();
    }
}
exports.Shortcut = Shortcut;
//# sourceMappingURL=shortcut.js.map