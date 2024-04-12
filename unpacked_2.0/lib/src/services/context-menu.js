"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextMenu = void 0;
const electron_1 = require("electron");
const i18n_1 = __importDefault(require("../i18n"));
class ContextMenu {
    constructor(mainWindow) {
        this.selectionMenu = electron_1.Menu.buildFromTemplate([
            { role: 'copy', label: i18n_1.default.t('context_menu_copy', { ns: 'contextMenu' }) },
            { type: 'separator' },
            { role: 'selectAll', label: i18n_1.default.t('context_menu_select_all', { ns: 'contextMenu' }) },
        ]);
        this.inputMenu = electron_1.Menu.buildFromTemplate([
            { role: 'cut', label: i18n_1.default.t('context_menu_cut', { ns: 'contextMenu' }) },
            { role: 'copy', label: i18n_1.default.t('context_menu_copy', { ns: 'contextMenu' }) },
            { role: 'paste', label: i18n_1.default.t('context_menu_paste', { ns: 'contextMenu' }) },
            { type: 'separator' },
            { role: 'selectAll', label: i18n_1.default.t('context_menu_select_all', { ns: 'contextMenu' }) },
        ]);
        this.mainWindow = mainWindow;
        this.onShowContextMenu();
    }
    onShowContextMenu() {
        this.mainWindow.webContents.on('context-menu', (e, props) => {
            const { selectionText, isEditable } = props;
            if (isEditable) {
                this.inputMenu.popup({ window: this.mainWindow });
            }
            else if (selectionText && selectionText.trim() !== '') {
                this.selectionMenu.popup({ window: this.mainWindow });
            }
        });
    }
}
exports.ContextMenu = ContextMenu;
//# sourceMappingURL=context-menu.js.map