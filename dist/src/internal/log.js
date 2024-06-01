"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.info = void 0;
const package_json_1 = __importDefault(require("../../package.json"));
const info = (message, obj) => {
    console.log(`[${package_json_1.default.name}@${package_json_1.default.version}] ${message}`, obj ? JSON.stringify(obj) : undefined);
};
exports.info = info;
const log = (message, obj) => {
    if (!process.env.SLY_DEBUG)
        return;
    console.log(`[${package_json_1.default.name}@${package_json_1.default.version}] ${message}`, obj ? JSON.stringify(obj) : undefined);
};
exports.log = log;
