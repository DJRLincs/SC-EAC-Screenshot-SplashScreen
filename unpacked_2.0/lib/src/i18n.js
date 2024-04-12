"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_i18n_1 = require("@rsilauncher/utils-i18n");
const i18next_1 = __importDefault(require("i18next"));
// We temporary load all translations at build time since we currently only support one language
// We will eventually use a backend to lazyload and cache locales and namespaces from AWS
// We will also need to sync main and renderer selected language with an IPC channel
// Links:
// - https://www.i18next.com/overview/plugins-and-utils#backends
// - https://www.i18next.com/overview/api#changelanguage
// - https://www.i18next.com/overview/api#onlanguagechanged
i18next_1.default.init({
    resources: {
        en: utils_i18n_1.en,
        fr: utils_i18n_1.fr,
    },
    lng: 'en',
    fallbackLng: 'en',
    returnNull: false,
});
exports.default = i18next_1.default;
//# sourceMappingURL=i18n.js.map