import axios from "axios";
import { EndpointRequest } from "./types";
import { endpointProxy } from "./proxy";
import { log } from "./log";

export const routeEvents = async (
  runtimeApi: string,
  bin?: string,
  endpoint?: URL
): Promise<void> => {
  log("Waiting for next event from Lambda Runtime API", { runtimeApi });

  const { headers, data } = await axios.get(
    `http://${runtimeApi}/2018-06-01/runtime/invocation/next`,
    {
      // block indefinitely until a response is received
      timeout: 0,
      responseType: "text",
    }
  );

  log("Received event from Lambda Runtime API", { headers, data });

  const requestId = headers["lambda-runtime-aws-request-id"];

  if (!requestId) {
    throw new Error("No request ID found in response headers");
  }

  const deadline = Number.parseInt(headers["lambda-runtime-deadline-ms"]);

  let payload: any | undefined = undefined;

  if (bin && !endpoint) {
    log("No endpoint specified, executing bin", { bin });

    const { execa } = await import("execa");
    // no endpoint, just exec the bin
    const { stdout } = await execa({
      stderr: ["inherit"],
    })`${bin} ${data}`;

    // TODO: handle timeout

    log("Bin execution complete", { bin, stdout });

    payload = JSON.parse(stdout);
  } else if (endpoint) {
    log("Endpoint specified, proxying request", { endpoint });

    const request: EndpointRequest = {
      requestId,
      endpoint,
      event: JSON.parse(data),
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

  await axios.post(
    `http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/response`,
    payload
  );

  log("Response sent to Lambda Runtime API", { runtimeApi, requestId });

  return routeEvents(runtimeApi, bin, endpoint);
};
