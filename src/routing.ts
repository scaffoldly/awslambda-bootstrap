import axios from "axios";
import { EndpointRequest } from "./types";
import { endpointProxy } from "./proxy";

export const routeEvents = async (
  runtimeApi: string,
  bin: string,
  endpoint?: string
): Promise<void> => {
  const { headers, data } = await axios.get(
    `http://${runtimeApi}/2018-06-01/runtime/invocation/next`,
    {
      // block indefinitely until a response is received
      timeout: 0,
      responseType: "text",
    }
  );

  const requestId = headers["lambda-runtime-aws-request-id"];

  if (!requestId) {
    throw new Error("No request ID found in response headers");
  }

  console.log("Received request from Lambda Runtime API", { requestId });

  const initialDeadline = Number.parseInt(
    headers["lambda-runtime-deadline-ms"]
  );

  let payload: any | undefined = undefined;

  if (!endpoint) {
    const { execa } = await import("execa");
    // no endpoint, just exec the bin
    const { stdout } = await execa({
      stderr: ["inherit"],
    })`${bin} ${data}`;

    payload = JSON.parse(stdout);
  } else {
    const request: EndpointRequest = {
      requestId,
      endpoint,
      event: JSON.parse(data),
      initialDeadline,
    };

    payload = (await endpointProxy(request)).payload;
  }

  await axios.post(
    `http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/response`,
    payload
  );

  console.log("Invocation response successfully sent to Lambda Runtime API", {
    requestId,
  });

  return routeEvents(runtimeApi, bin, endpoint);
};
