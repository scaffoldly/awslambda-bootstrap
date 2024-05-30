import { APIGatewayProxyResult } from "aws-lambda";
import axios, { AxiosResponseHeaders, RawAxiosResponseHeaders } from "axios";
import net from "net";
import { EndpointRequest, EndpointResponse } from "./types";
import { log } from "./log";

function convertHeaders(
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders
): { [header: string]: boolean | number | string } | undefined {
  if (!headers) {
    return undefined;
  }

  return Object.keys(headers).reduce((acc, key) => {
    const value = headers[key];

    if (!value) return acc;

    if (Array.isArray(value)) {
      acc[key] = value.join(", ");
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      acc[key] = value;
    }

    return acc;
  }, {} as { [header: string]: boolean | number | string });
}

const waitForEndpoint = async (
  endpoint: URL,
  deadline: number
): Promise<{ deadline: number }> => {
  const start = Date.now();

  // Stop recursing if the deadline has passed
  if (deadline < start) {
    return { deadline: 0 };
  }

  const hostname = endpoint.hostname;
  const port =
    parseInt(endpoint.port, 10) || (endpoint.protocol === "https:" ? 443 : 80);

  return new Promise((resolve) => {
    const socket = new net.Socket();

    const onError = () => {
      socket.destroy();
      return waitForEndpoint(endpoint, deadline - (Date.now() - start)).then(
        resolve
      );
    };

    socket.setTimeout(Date.now() - deadline);
    socket.once("error", onError);
    socket.once("timeout", onError);

    socket.connect(port, hostname, () => {
      socket.end();
      resolve({ deadline: deadline - (Date.now() - start) });
    });
  });
};

export const endpointProxy = async ({
  requestId,
  endpoint,
  event,
  initialDeadline,
}: EndpointRequest): Promise<EndpointResponse> => {
  const {
    requestContext,
    rawPath,
    rawQueryString,
    headers: rawHeaders,
    body: rawBody,
    isBase64Encoded,
  } = event;
  const method = requestContext.http.method;

  log("Waiting for endpoint to start", { endpoint, initialDeadline });
  const { deadline } = await waitForEndpoint(endpoint, initialDeadline);
  log("Endpoint started", { endpoint, deadline });

  if (!deadline) {
    throw new Error(
      `${endpoint.toString()} took longer than ${Math.floor(
        initialDeadline / 1000
      )} second(s) to start.`
    );
  }

  const url = new URL(rawPath, endpoint);
  if (rawQueryString) {
    url.search = new URLSearchParams(rawQueryString).toString();
  }

  const decodedBody =
    isBase64Encoded && rawBody ? Buffer.from(rawBody, "base64") : rawBody;

  log("Proxying request", { url, method, rawHeaders, decodedBody, deadline });

  const response = await axios.request({
    method: method.toLowerCase(),
    url: url.toString(),
    headers: rawHeaders,
    data: decodedBody,
    timeout: Date.now() - deadline,
    responseType: "arraybuffer",
  });

  const { data: rawData, headers: rawResponseHeaders } = response;

  log("Proxy request complete", { url, method, rawResponseHeaders, rawData });

  const payload: APIGatewayProxyResult = {
    statusCode: response.status,
    headers: convertHeaders(rawResponseHeaders),
    body: Buffer.from(rawData).toString("base64"),
    isBase64Encoded: true,
  };

  return {
    requestId,
    payload,
  };
};
