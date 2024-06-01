"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpointProxy = exports.endpointExec = exports.endpointSpawn = void 0;
const axios_1 = __importStar(require("axios"));
const net_1 = __importDefault(require("net"));
const log_1 = require("./log");
const child_process_1 = require("child_process");
function convertHeaders(headers) {
    if (!headers) {
        return undefined;
    }
    return Object.keys(headers).reduce((acc, key) => {
        const value = headers[key];
        if (!value)
            return acc;
        if (Array.isArray(value)) {
            acc[key] = value.join(", ");
        }
        else if (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean") {
            acc[key] = value;
        }
        return acc;
    }, {});
}
const waitForEndpoint = async (endpoint, deadline) => {
    const start = Date.now();
    const timeout = deadline - start;
    // Stop recursing if the deadline has passed
    if (timeout < 0) {
        return { timeout: 0 };
    }
    const hostname = endpoint.hostname;
    const port = parseInt(endpoint.port, 10) || (endpoint.protocol === "https:" ? 443 : 80);
    return new Promise((resolve) => {
        const socket = new net_1.default.Socket();
        const onError = () => {
            socket.destroy();
            return waitForEndpoint(endpoint, deadline - (Date.now() - start)).then(resolve);
        };
        socket.setTimeout(deadline - start);
        socket.once("error", onError);
        socket.once("timeout", onError);
        socket.connect(port, hostname, () => {
            socket.end();
            resolve({ timeout: deadline - Date.now() });
        });
    });
};
const endpointSpawn = async (handler, offline) => {
    // handler is in the format of
    // - `{some-bin}@http://localhost:{the-bins-port} (will start some-bin, and forward requests to the http server)
    // - `http://localhost:{some-port}` (will forward the request to the http server)
    // - `{some-bin}` (will forward the event to the bin)
    let [bin, endpoint] = handler.split(/(?<=^[^@]*)@/);
    let childProcess = undefined;
    if (bin && !endpoint) {
        try {
            endpoint = new URL(bin).toString();
            bin = undefined;
        }
        catch (e) { }
    }
    if (bin && endpoint) {
        (0, log_1.log)("Starting child process", { bin });
        const subcommand = offline ? "dev" : "start";
        (0, log_1.info)(`Running: \`${bin} ${subcommand}\``);
        childProcess = (0, child_process_1.spawn)(bin, [subcommand], {
            detached: true,
            stdio: "inherit",
        });
        // TODO Decide if we should do this...
        childProcess.unref();
        (0, log_1.log)("Started child process", { bin, subcommand, pid: childProcess.pid });
    }
    endpoint = endpoint ? new URL(endpoint) : undefined;
    return { childProcess, bin, endpoint };
};
exports.endpointSpawn = endpointSpawn;
const endpointExec = async ({ requestId, bin, event, deadline, }) => {
    const { execa } = await import("execa");
    const { stdout } = await execa({
        stderr: ["inherit"],
    }) `${bin} ${event}`;
    // TODO: handle deadline
    (0, log_1.info)("TODO: need to handle deadline", { deadline });
    const payload = JSON.parse(stdout);
    return {
        requestId,
        payload,
    };
};
exports.endpointExec = endpointExec;
const endpointProxy = async ({ requestId, endpoint, event, deadline, }) => {
    const { requestContext, rawPath, rawQueryString, headers: rawHeaders, body: rawBody, isBase64Encoded, } = event;
    const method = requestContext.http.method;
    (0, log_1.log)("Waiting for endpoint to start", { endpoint, deadline });
    const { timeout } = await waitForEndpoint(endpoint, deadline);
    if (!timeout) {
        throw new Error(`${endpoint.toString()} took longer than ${deadline} milliseconds to start.`);
    }
    const url = new URL(rawPath, endpoint);
    if (rawQueryString) {
        url.search = new URLSearchParams(rawQueryString).toString();
    }
    const decodedBody = isBase64Encoded && rawBody ? Buffer.from(rawBody, "base64") : rawBody;
    (0, log_1.log)("Proxying request", { url, method, rawHeaders, decodedBody, timeout });
    let response = undefined;
    try {
        response = await axios_1.default.request({
            method: method.toLowerCase(),
            url: url.toString(),
            headers: rawHeaders,
            data: decodedBody,
            timeout,
            responseType: "arraybuffer",
        });
    }
    catch (e) {
        if ((0, axios_1.isAxiosError)(e) && e.response) {
            response = e.response;
        }
        else {
            throw e;
        }
    }
    if (!response) {
        throw new Error("No response received");
    }
    const { data: rawData, headers: rawResponseHeaders } = response;
    (0, log_1.log)("Proxy request complete", { url, method, rawResponseHeaders, rawData });
    return {
        requestId,
        payload: {
            statusCode: response.status,
            headers: convertHeaders(rawResponseHeaders),
            body: Buffer.from(rawData).toString("base64"),
            isBase64Encoded: true,
        },
    };
};
exports.endpointProxy = endpointProxy;
