import { ChildProcess, spawn } from "child_process";
import { routeEvents } from "./routing";
import { info, log } from "./log";

const { _HANDLER, IS_OFFLINE, AWS_LAMBDA_RUNTIME_API } = process.env;

export const bootstrap = async (): Promise<void> => {
  if (!AWS_LAMBDA_RUNTIME_API) {
    throw new Error("No AWS_LAMBDA_RUNTIME_API specified");
  }

  if (!_HANDLER) {
    throw new Error("No handler specified");
  }

  log("Bootstraping", { _HANDLER, IS_OFFLINE, AWS_LAMBDA_RUNTIME_API });

  // handler is in the format of
  // - `{some-bin}@http://localhost:{the-bins-port} (will start some-bin, and forward requests to the http server)
  // - `http://localhost:{some-port}` (will forward the request to the http server)
  // - `{some-bin}` (will forward the event to the bin)

  let [bin, endpoint] = _HANDLER.split(/(?<=^[^@]*)@/) as [
    string | undefined,
    string | undefined | URL
  ];

  let childProcess: ChildProcess | undefined = undefined;

  if (bin && !endpoint) {
    try {
      endpoint = new URL(bin).toString();
      bin = undefined;
    } catch (e) {}
  }

  if (bin && endpoint) {
    log("Starting child process", { bin });

    const subcommand = IS_OFFLINE === "true" ? "dev" : "start";

    info(`Running: \`${bin} ${subcommand}\``);

    childProcess = spawn(bin, [subcommand], {
      detached: true,
      stdio: "inherit",
    });

    // TODO Decide if we should do this...
    childProcess.unref();

    log("Started child process", { bin, subcommand, pid: childProcess.pid });
  }

  endpoint = endpoint ? new URL(endpoint) : undefined;

  try {
    log("Routing events", { bin, endpoint });
    await routeEvents(AWS_LAMBDA_RUNTIME_API, bin, endpoint);
  } catch (e) {
    if (childProcess) {
      log("Killing child process", { pid: childProcess.pid });
      childProcess.kill();
    }
    throw e;
  }
};
