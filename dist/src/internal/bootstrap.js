"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const routing_1 = require("./routing");
const log_1 = require("./log");
const proxy_1 = require("./proxy");
const { _HANDLER, IS_OFFLINE, AWS_LAMBDA_RUNTIME_API } = process.env;
const bootstrap = async () => {
    if (!AWS_LAMBDA_RUNTIME_API) {
        throw new Error("No AWS_LAMBDA_RUNTIME_API specified");
    }
    if (!_HANDLER) {
        throw new Error("No handler specified");
    }
    (0, log_1.log)("Bootstraping", { _HANDLER, IS_OFFLINE, AWS_LAMBDA_RUNTIME_API });
    const { childProcess, bin, endpoint } = await (0, proxy_1.endpointSpawn)(_HANDLER, IS_OFFLINE === "true");
    try {
        (0, log_1.log)("Routing events", { bin, endpoint });
        await (0, routing_1.routeEvents)(AWS_LAMBDA_RUNTIME_API, bin, endpoint);
    }
    catch (e) {
        if (childProcess) {
            (0, log_1.log)("Killing child process", { pid: childProcess.pid });
            childProcess.kill();
        }
        throw e;
    }
};
exports.bootstrap = bootstrap;
