import { ChildProcess, spawn } from "child_process";
import which from "which";
import { routeEvents } from "./routing";
const { _HANDLER, IS_OFFLINE, AWS_LAMBDA_RUNTIME_API } = process.env;

export const bootstrap = async (): Promise<void> => {
  if (!AWS_LAMBDA_RUNTIME_API) {
    throw new Error("No AWS_LAMBDA_RUNTIME_API specified");
  }

  if (!_HANDLER) {
    throw new Error("No handler specified");
  }

  let handler: URL | undefined = undefined;
  let bin: string;
  let endpoint: string | undefined = undefined;

  // handler is in the format of
  // - `{some-bin}:http://localhost:{the-bins-port} (will start some-bin, and forward requests to the http server)
  // - `http://localhost:{some-port}` (will forward the request to the http server)
  // - `{some-bin}` (will forward the event to the bin)

  try {
    handler = new URL(_HANDLER);
    bin = handler.protocol.slice(0, -1);
    endpoint = handler.toString();
  } catch (e) {
    bin = _HANDLER;
  }

  let childProcess: ChildProcess | undefined = undefined;

  if (handler && bin !== "http" && bin !== "https") {
    endpoint = handler.pathname;

    const subcommand = IS_OFFLINE === "true" ? "dev" : "start";

    childProcess = spawn(bin, [subcommand], {
      detached: true,
      stdio: "inherit",
    });
  }

  try {
    await which(bin);
    await routeEvents(AWS_LAMBDA_RUNTIME_API, bin, endpoint);
  } catch (e) {
    if (childProcess) {
      childProcess.kill();
    }
    throw e;
  }
};
