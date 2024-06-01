"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeEvents = void 0;
const proxy_1 = require("./proxy");
const log_1 = require("./log");
const runtime_1 = require("./runtime");
const routeEvents = async (runtimeApi, bin, endpoint) => {
    (0, log_1.log)("Waiting for next event from Lambda Runtime API", { runtimeApi });
    const { requestId, event, deadline } = await (0, runtime_1.nextEvent)(runtimeApi);
    let payload = undefined;
    if (bin && !endpoint) {
        (0, log_1.log)("No endpoint specified, executing bin", { bin });
        const request = {
            requestId,
            bin,
            event,
            deadline,
        };
        payload = (await (0, proxy_1.endpointExec)(request)).payload;
        (0, log_1.log)("Bin execution complete", { bin, payload });
    }
    else if (endpoint) {
        (0, log_1.log)("Endpoint specified, proxying request", { endpoint });
        const request = {
            requestId,
            endpoint,
            event,
            deadline,
        };
        payload = (await (0, proxy_1.endpointProxy)(request)).payload;
        (0, log_1.log)("Proxy request complete", { endpoint, payload });
    }
    else {
        throw new Error(`
Missing bin and handler on _HANDLER: ${process.env._HANDLER}. 
Expected format: {bin}@{endpoint} or {bin} or {endpoint}:
 - next@http://localhost:3000
 - /usr/bin/app@http://localhost:3000
 - http://localhost:3000
 - /usr/bin/app
`);
    }
    await (0, runtime_1.respondToEvent)(runtimeApi, requestId, payload);
    (0, log_1.log)("Response sent to Lambda Runtime API", { runtimeApi, requestId });
    return (0, exports.routeEvents)(runtimeApi, bin, endpoint);
};
exports.routeEvents = routeEvents;
