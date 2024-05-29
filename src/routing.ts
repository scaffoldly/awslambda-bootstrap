import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
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
    }
  );

  const requestId = headers["Lambda-Runtime-Aws-Request-Id"] as string;

  console.log("Received request from Lambda Runtime API", { requestId });

  const initialDeadline = Number.parseInt(
    headers["Lambda-Runtime-Deadline-Ms"]
  );

  // TODO handle V1 payloads
  const event = JSON.parse(data) as APIGatewayProxyEventV2;
  let payload: APIGatewayProxyResultV2 | undefined = undefined;

  if (!endpoint) {
    const { execa } = await import("execa");
    // no endpoint, just exec the bin
    const { stdout } = await execa({
      stderr: ["inherit"],
    })`${bin} ${JSON.stringify(event)}`;

    payload = JSON.parse(stdout) as APIGatewayProxyResultV2;
  } else {
    const request: EndpointRequest = {
      requestId,
      endpoint,
      event,
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
