"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReleaseCandidate = exports.version = void 0;
const package_json_1 = __importDefault(require("../../package.json"));
exports.version = package_json_1.default.version;
const isReleaseCandidate = () => package_json_1.default.version.includes('-rc.');
exports.isReleaseCandidate = isReleaseCandidate;
//# sourceMappingURL=packageJsonFile.js.map