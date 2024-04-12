"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const package_json_1 = __importDefault(require("../../package.json"));
// Use default: {} for object in order to have default value works
// @doc: https://github.com/sindresorhus/electron-store/issues/102#issuecomment-586479988
exports.schema = {
    application: {
        type: 'object',
        properties: {
            version: {
                type: 'string',
                default: package_json_1.default.version,
            },
            volume: {
                type: 'number',
                default: 50,
            },
            quitOnWindowClose: {
                type: 'boolean',
                default: false,
            },
            download: {
                type: 'object',
                properties: {
                    maximumDownloadBandwidth: {
                        type: 'number',
                        default: 0,
                    },
                    concurrentTransfers: {
                        type: 'number',
                        default: 25,
                    },
                }
            },
            window: {
                type: 'object',
                properties: {
                    large: {
                        type: 'object',
                        properties: {
                            bounds: {
                                type: 'object',
                                properties: {
                                    x: { type: 'number' },
                                    y: { type: 'number' },
                                    width: { type: 'number' },
                                    height: { type: 'number' },
                                },
                                default: null,
                            }
                        }
                    },
                    small: {
                        type: 'object',
                        properties: {
                            bounds: {
                                type: 'object',
                                properties: {
                                    x: { type: 'number' },
                                    y: { type: 'number' },
                                    width: { type: 'number' },
                                    height: { type: 'number' },
                                },
                                default: null,
                            }
                        }
                    }
                }
            }
        },
        default: {},
    },
    identity: {
        type: ['object', 'null'],
        properties: {
            username: {
                type: 'string',
            },
            privileged: {
                type: 'boolean',
                default: false,
            },
            heapAccountId: {
                type: 'string',
            },
            trackingMetricsId: {
                type: 'string',
            },
            avatar: {
                type: 'string',
            },
        },
        default: null,
    },
    session: {
        type: ['object', 'null'],
        properties: {
            displayName: {
                type: 'string',
            },
            nickname: {
                type: 'string',
            },
            key: {
                type: 'string',
            },
            value: {
                type: 'string',
            },
            cookie: {
                type: 'string',
            },
            expires: {
                type: 'number',
            },
        },
        default: null,
    },
    device: {
        type: ['object', 'null'],
        properties: {
            key: {
                type: 'string',
            },
            value: {
                type: 'string',
            },
            cookie: {
                type: 'string',
            },
        },
        default: null,
    },
    library: {
        type: 'object',
        properties: {
            libraryFolder: { type: 'string' },
            installed: {
                type: ['array'],
                items: {
                    type: ['object'],
                    properties: {
                        gameId: { type: 'string' },
                        gameName: { type: 'string' },
                        channels: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    version: { type: 'number' },
                                    versionLabel: { type: 'string' },
                                    platformId: { type: 'string' },
                                    servicesEndpoint: { type: 'string' },
                                    nid: { type: 'string' },
                                    status: { type: 'string' },
                                    network: {
                                        type: ['object', 'null'],
                                        properties: {
                                            mesh: {
                                                type: ['object'],
                                                properties: {
                                                    channels: {
                                                        type: ['array'],
                                                        items: {
                                                            type: ['object'],
                                                            properties: {
                                                                endpoint: { type: 'string' },
                                                                transport_security: { type: 'string' },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            defaults: {
                type: ['array'],
                items: {
                    type: 'object',
                    properties: {
                        platformId: { type: 'string' },
                        gameId: { type: 'string' },
                        gameName: { type: 'string' },
                        channelId: { type: 'string' },
                        channelName: { type: 'string' },
                    },
                },
            },
            settings: {
                type: ['array'],
                items: {
                    type: 'object',
                    properties: {
                        gameId: { type: 'string' },
                        channelId: { type: 'string' },
                        gameName: { type: 'string' },
                        channelName: { type: ['string', 'null'] },
                        hostname: { type: ['string', 'null'] },
                        port: { type: ['number', 'null'] },
                        servicesEndpoint: { type: ['string', 'null'] },
                        eacSandbox: { type: 'boolean' },
                        installDir: { type: ['string', 'null'] },
                        executable: { type: ['string', 'null'] },
                        launchOptions: { type: ['string', 'null'] },
                        network: {
                            type: ['object', 'null'],
                            properties: {
                                mesh: {
                                    type: ['object'],
                                    properties: {
                                        channels: {
                                            type: ['array'],
                                            items: {
                                                type: ['object'],
                                                properties: {
                                                    endpoint: { type: 'string' },
                                                    transport_security: { type: 'string' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        default: {
            installed: [],
            defaults: [],
            settings: [],
        },
    },
};
//# sourceMappingURL=store.schema.js.map