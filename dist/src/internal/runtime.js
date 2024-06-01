"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToEvent = exports.nextEvent = void 0;
const axios_1 = __importDefault(require("axios"));
const nextEvent = async (runtimeApi) => {
    const { headers, data } = await axios_1.default.get(`http://${runtimeApi}/2018-06-01/runtime/invocation/next`, {
        // block indefinitely until a response is received
        timeout: 0,
        responseType: "text",
    });
    const requestId = headers["lambda-runtime-aws-request-id"];
    if (!requestId) {
        throw new Error("No request ID found in response headers");
    }
    const deadline = Number.parseInt(headers["lambda-runtime-deadline-ms"]);
    const event = JSON.parse(data);
    return { requestId, event, deadline };
};
exports.nextEvent = nextEvent;
const respondToEvent = async (runtimeApi, requestId, payload) => {
    await axios_1.default.post(`http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/response`, payload);
};
exports.respondToEvent = respondToEvent;
