"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../src/internal/log");
const package_json_1 = __importDefault(require("../package.json"));
const bootstrap_1 = require("../src/internal/bootstrap");
(async () => {
    if (process.argv.includes("--version")) {
        console.log(package_json_1.default.version);
        return;
    }
    (0, log_1.log)("Starting bootstrap", { env: JSON.stringify(process.env) });
    try {
        await (0, bootstrap_1.bootstrap)();
    }
    catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
        }
        else {
            console.error(e);
        }
        process.exit(1);
    }
    (0, log_1.log)("Bootstrap complete");
})();
