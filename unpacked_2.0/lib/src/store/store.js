"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_store_1 = __importDefault(require("electron-store"));
const electron_log_1 = __importDefault(require("electron-log"));
const package_json_1 = __importDefault(require("../../package.json"));
const store_schema_1 = require("./store.schema");
//Need to add options this way
//There is a typescript issue with electron-store
const options = {
    name: 'launcher store',
    projectVersion: package_json_1.default.version,
    clearInvalidConfig: true,
};
// In case of error, reset the store
// instead of crashing the app
const createStore = () => {
    try {
        return new electron_store_1.default(Object.assign(Object.assign({}, options), { schema: store_schema_1.schema }));
    }
    catch (error) {
        electron_log_1.default.error('Error while creating store', error);
        const store = new electron_store_1.default(Object.assign(Object.assign({}, options), { schema: undefined }));
        store.clear();
        return new electron_store_1.default(Object.assign(Object.assign({}, options), { schema: store_schema_1.schema }));
    }
};
const store = createStore();
exports.default = store;
//# sourceMappingURL=store.js.map