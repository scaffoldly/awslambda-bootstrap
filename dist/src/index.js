"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToEvent = exports.nextEvent = exports.endpointProxy = exports.endpointSpawn = void 0;
const proxy_1 = require("./internal/proxy");
Object.defineProperty(exports, "endpointSpawn", { enumerable: true, get: function () { return proxy_1.endpointSpawn; } });
Object.defineProperty(exports, "endpointProxy", { enumerable: true, get: function () { return proxy_1.endpointProxy; } });
const runtime_1 = require("./internal/runtime");
Object.defineProperty(exports, "nextEvent", { enumerable: true, get: function () { return runtime_1.nextEvent; } });
Object.defineProperty(exports, "respondToEvent", { enumerable: true, get: function () { return runtime_1.respondToEvent; } });
