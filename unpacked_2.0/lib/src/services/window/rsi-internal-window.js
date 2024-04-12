"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RsiInternalWindow = void 0;
const electron_1 = require("electron");
const helper_1 = require("./helper");
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
class RsiInternalWindow extends electron_1.BrowserWindow {
    constructor(options) {
        const windowOptions = Object.assign({}, options);
        Object.assign(windowOptions.webPreferences || {}, {
            devTools: process.env.NODE_ENV === 'development',
            nodeIntegration: false,
        });
        if (windowOptions.icon && typeof windowOptions.icon === 'string') {
            if (require.main && require.main.filename) {
                const root = path_1.default.dirname(require.main.filename);
                windowOptions.icon = path_1.default.join(root, windowOptions.icon);
            }
        }
        super(windowOptions);
        this.webContents.setWindowOpenHandler((details) => {
            if ((0, helper_1.isSafeToOpenURL)(details.url)) {
                (0, open_1.default)(details.url);
            }
            return { action: 'deny' }; // equivalent to preventDefault()
        });
        this.webContents.on('will-navigate', (ev, newUrl) => {
            if (!(0, helper_1.shouldNavigateToURL)(newUrl) && (0, helper_1.isSafeToOpenURL)(newUrl)) {
                ev.preventDefault();
                (0, open_1.default)(newUrl);
            }
        });
        this.once('ready-to-show', () => {
            this.show();
        });
        if (process.env.NODE_ENV === 'development') {
            this.webContents.openDevTools();
        }
    }
}
exports.RsiInternalWindow = RsiInternalWindow;
//# sourceMappingURL=rsi-internal-window.js.map