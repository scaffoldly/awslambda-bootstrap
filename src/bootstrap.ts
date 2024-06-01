import { routeEvents } from "./routing";
import { log } from "./log";
import { endpointSpawn } from "./proxy";

const { _HANDLER, IS_OFFLINE, AWS_LAMBDA_RUNTIME_API } = process.env;

export const bootstrap = async (): Promise<void> => {
  if (!AWS_LAMBDA_RUNTIME_API) {
    throw new Error("No AWS_LAMBDA_RUNTIME_API specified");
  }

  if (!_HANDLER) {
    throw new Error("No handler specified");
  }

  log("Bootstraping", { _HANDLER, IS_OFFLINE, AWS_LAMBDA_RUNTIME_API });

  const { childProcess, bin, endpoint } = await endpointSpawn(
    _HANDLER,
    IS_OFFLINE === "true"
  );

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
