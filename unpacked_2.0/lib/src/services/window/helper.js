"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveExistingWindow = exports.retrieveExistingWindowByTarget = exports.isSafeToOpenURL = exports.shouldNavigateToURL = exports.URL_FILTERS = void 0;
const electron_1 = require("electron");
const glob_to_regexp_1 = __importDefault(require("glob-to-regexp"));
exports.URL_FILTERS = [
    'htt*://robertsspaceindustries.com?(/)*',
    'htt*://*.robertsspaceindustries.com?(/)*',
    'htt*://*.cloudimperiumgames.com?(/)*',
    'htt*://cloudimperiumgames.com?(/)*',
    'htt*://*.local.dev/?(/)*',
];
const shouldNavigateToURL = (url) => {
    const allowed = exports.URL_FILTERS.reduce((acc, glob) => {
        const reg = new RegExp((0, glob_to_regexp_1.default)(glob), 'i');
        return acc || reg.test(url);
    }, false);
    return allowed;
};
exports.shouldNavigateToURL = shouldNavigateToURL;
const isSafeToOpenURL = (url) => {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
};
exports.isSafeToOpenURL = isSafeToOpenURL;
const targetToWindowId = {};
const retrieveExistingWindowByTarget = (target) => {
    if (!targetToWindowId[target]) {
        return null;
    }
    const window = electron_1.BrowserWindow.fromId(targetToWindowId[target]);
    if (!window) {
        delete targetToWindowId[target];
    }
    return window;
};
exports.retrieveExistingWindowByTarget = retrieveExistingWindowByTarget;
const saveExistingWindow = (target, window) => {
    if (target) {
        targetToWindowId[target] = window.id;
    }
};
exports.saveExistingWindow = saveExistingWindow;
//# sourceMappingURL=helper.js.map