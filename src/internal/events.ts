import { log } from "./log";
import { EndpointProxyRequest, EndpointExecRequest } from "./types";
import { endpointExec, endpointProxy } from "./endpoints";
import { getRuntimeEvent, postRuntimeEventResponse } from "./runtime";

export const pollForEvents = async (
  runtimeApi: string,
  bin?: string,
  endpoint?: URL
): Promise<void> => {
  log("Waiting for next event from Lambda Runtime API", { runtimeApi });

  const { requestId, event, deadline } = await getRuntimeEvent(runtimeApi);

  let payload: any | undefined = undefined;

  if (bin && !endpoint) {
    log("No endpoint specified, executing bin", { bin });

    const request: EndpointExecRequest = {
      requestId,
      bin,
      event,
      deadline,
    };

    payload = (await endpointExec(request)).payload;

    log("Bin execution complete", { bin, payload });
  } else if (endpoint) {
    log("Endpoint specified, proxying request", { endpoint });

    const request: EndpointProxyRequest = {
      requestId,
      endpoint,
      event,
      deadline,
    };

    payload = (await endpointProxy(request)).payload;

    log("Proxy request complete", { endpoint, payload });
  } else {
    throw new Error(
      `
Missing bin and handler on _HANDLER: ${process.env._HANDLER}. 
Expected format: {bin}@{endpoint} or {bin} or {endpoint}:
 - next@http://localhost:3000
 - /usr/bin/app@http://localhost:3000
 - http://localhost:3000
 - /usr/bin/app
`
    );
  }

  await postRuntimeEventResponse(runtimeApi, requestId, payload);

  log("Response sent to Lambda Runtime API", { runtimeApi, requestId });

  return pollForEvents(runtimeApi, bin, endpoint);
};
