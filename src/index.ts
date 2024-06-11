import { pollForEvents } from "./internal/events";
import { endpointSpawn, endpointProxy } from "./internal/endpoints";
import { log } from "./internal/log";
import { getRuntimeEvent, postRuntimeEventResponse } from "./internal/runtime";
import {
  RuntimeEvent,
  EndpointExecRequest,
  EndpointProxyRequest,
  EndpointResponse,
} from "./internal/types";
import { WebsocketProxy } from "./internal/websocket";

const { _HANDLER, AWS_LAMBDA_RUNTIME_API, _WEBSOCKET_ROUTE } = process.env;

export const run = async (): Promise<void> => {
  if (!AWS_LAMBDA_RUNTIME_API) {
    throw new Error("No AWS_LAMBDA_RUNTIME_API specified");
  }

  if (!_HANDLER) {
    throw new Error("No handler specified");
  }

  log("Bootstraping", { _HANDLER, AWS_LAMBDA_RUNTIME_API, _WEBSOCKET_ROUTE });

  const { childProcess, bin, endpoint } = await endpointSpawn(
    _HANDLER,
    process.env
  );

  const websocketProxy = new WebsocketProxy(endpoint, _WEBSOCKET_ROUTE);

  try {
    log("Polling for events", { bin, endpoint });
    await pollForEvents(AWS_LAMBDA_RUNTIME_API, bin, endpoint, websocketProxy);
  } catch (e) {
    if (childProcess) {
      log("Killing child process", { pid: childProcess.pid });
      childProcess.kill();
    }
    throw e;
  }
};

export {
  endpointSpawn,
  endpointProxy,
  getRuntimeEvent,
  postRuntimeEventResponse,
  RuntimeEvent,
  EndpointExecRequest,
  EndpointProxyRequest,
  EndpointResponse,
};
