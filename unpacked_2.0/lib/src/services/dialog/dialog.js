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
const main_1 = require("electron/main");
const app_shared_1 = require("@rsilauncher/app-shared");
const electron_log_1 = __importDefault(require("electron-log"));
class Dialog {
    constructor(window) {
        this.window = window;
        this.initDialogEvents();
    }
    initDialogEvents() {
        this.openDialog();
        this.openLibraryFolderDialog();
    }
    openDialog() {
        main_1.ipcMain.handle(app_shared_1.ipcEvents.dialog.SHOW_OPEN_DIALOG, (_event, data) => {
            if (this.window) {
                return main_1.dialog.showOpenDialog(this.window, data);
            }
        });
    }
    openLibraryFolderDialog() {
        main_1.ipcMain.handle(app_shared_1.ipcEvents.dialog.SHOW_LIBRARY_FOLDER_DIALOG, (_event, path) => __awaiter(this, void 0, void 0, function* () {
            try {
                const options = {
                    title: 'Choose Games folder',
                    defaultPath: path,
                    properties: ['openDirectory'],
                };
                const response = yield main_1.dialog.showOpenDialog(this.window, options);
                return response.filePaths;
            }
            catch (e) {
                electron_log_1.default.error('[ERROR LIBRARY FOLDER DIALOG]', e);
            }
        }));
    }
}
exports.default = Dialog;
//# sourceMappingURL=dialog.js.map