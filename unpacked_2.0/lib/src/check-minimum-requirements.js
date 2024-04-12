"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respectCPUCapabilites = exports.respectMinimumWindowsVersion = void 0;
const compare_versions_1 = __importDefault(require("compare-versions"));
const respectMinimumWindowsVersion = (release = '') => {
    const MINIMUM_WINDOWS_VERSION = '6.3';
    if (!release) {
        return false;
    }
    return compare_versions_1.default.compare(release, MINIMUM_WINDOWS_VERSION, '>=');
};
exports.respectMinimumWindowsVersion = respectMinimumWindowsVersion;
const respectCPUCapabilites = (cpuInfo) => {
    if (!cpuInfo) {
        return false;
    }
    const isX86CpuFeatures = (info) => {
        return 'flags' in info;
    };
    if (!isX86CpuFeatures(cpuInfo)) {
        return false;
    }
    return Boolean(cpuInfo.flags.avx);
};
exports.respectCPUCapabilites = respectCPUCapabilites;
//# sourceMappingURL=check-minimum-requirements.js.map