"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallerWithPatcherEvents = void 0;
const cig_data_patcher_1 = require("cig-data-patcher");
const PatcherEvents = Object.assign({}, cig_data_patcher_1.InstallerPhaseEvents);
exports.InstallerWithPatcherEvents = Object.assign(Object.assign({}, PatcherEvents), { DownloadStart: 'installer@initial-download-start', DownloadProgress: 'installer@initial-download-progress', DownloadEnd: 'installer@initial-download-end', PauseSuccess: 'installer@pause-successful', PauseFailed: 'installer@pause-failed', ResumeSuccess: 'installer@resume-successful', ResumeFailed: 'installer@resume-failed', CancelSuccess: 'installer@cancel-successful', CancelFailed: 'installer@cancel-failed', SetOptionSuccess: 'installer@set-option-successful', InstallSuccess: 'installer@install-successful', InstallFailed: 'installer@install-failed', InstallProgress: 'installer@install-progress' });
//# sourceMappingURL=types.js.map