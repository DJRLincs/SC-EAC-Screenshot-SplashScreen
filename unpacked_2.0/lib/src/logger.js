"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = exports.setupLogger = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const LOG_FILENAME = 'log.log';
const stringifyObject = (obj) => {
    try {
        return JSON.stringify(obj, null, 1);
    }
    catch (error) {
        return util_1.default.inspect(obj);
    }
};
const stringifyData = (data) => {
    var _a;
    if (data instanceof Error) {
        return { stack: (_a = data.stack) === null || _a === void 0 ? void 0 : _a.split('\n') };
    }
    return data;
};
const stringifyArray = (datas) => {
    // eslint-disable-next-line no-param-reassign
    if (datas.length === 1) {
        return stringifyObject(stringifyData(datas[0]));
    }
    return stringifyObject(datas.map((data) => stringifyData(data)));
};
const setupLogger = ({ level }) => {
    const defaultFileTransport = electron_log_1.default.transports.file;
    defaultFileTransport.format = '{ "t":"{y}-{m}-{d} {h}:{i}:{s}.{ms}", "[{processType}][{level}]":{text} },';
    electron_log_1.default.hooks.push((message) => (Object.assign(Object.assign({}, message), { data: [stringifyArray(message.data)] })));
    electron_log_1.default.transports.file.resolvePath = (variables) => 
    // store logs in a log.log file in order to be consistent
    // with previous behavior of the package
    path_1.default.join(variables.userData, `logs/${LOG_FILENAME}`);
    electron_log_1.default.transports.console.level = level;
    electron_log_1.default.transports.file.level = level;
    electron_log_1.default.transports.file.maxSize = 5 * 1024 * 1024;
};
exports.setupLogger = setupLogger;
const logEvent = (name, data) => {
    const event = { event: name, data: {} };
    if (data && Object.keys(data).length > 0) {
        event.data = data;
    }
    electron_log_1.default.info(event);
};
exports.logEvent = logEvent;
//# sourceMappingURL=logger.js.map