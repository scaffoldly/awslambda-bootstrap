import axios, {
  AxiosResponse,
  AxiosResponseHeaders,
  RawAxiosResponseHeaders,
  isAxiosError,
} from "axios";
import net from "net";
import {
  EndpointExecRequest,
  EndpointProxyRequest,
  EndpointResponse,
  SpawnResult,
} from "./types";
import { info, log } from "./log";
import { ChildProcess, spawn } from "child_process";
import { APIGatewayProxyEventV2 } from "aws-lambda";

function wsify(url?: URL): URL | undefined {
  if (!url) return undefined;

  const wsUrl = new URL(url.toString());
  wsUrl.protocol = url.protocol.replace("http", "ws");

  if (!wsUrl.protocol.startsWith("ws")) {
    return undefined;
  }

  return wsUrl;
}

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
): Promise<{ timeout: number }> => {
  const start = Date.now();
  const timeout = deadline - start;

  // Stop recursing if the deadline has passed
  if (timeout < 0) {
    return { timeout: 0 };
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

    socket.setTimeout(deadline - start);
    socket.once("error", onError);
    socket.once("timeout", onError);

    socket.connect(port, hostname, () => {
      socket.end();
      resolve({ timeout: deadline - Date.now() });
    });
  });
};

export const endpointSpawn = async (
  handler: string,
  env?: NodeJS.ProcessEnv,
  detached: boolean = true
): Promise<SpawnResult> => {
  // handler is in the format of
  // - `{some-bin}@http://localhost:{the-bins-port} (will start some-bin, and forward requests to the http server)
  // - `http://localhost:{some-port}` (will forward the request to the http server)
  // - `{some-bin}` (will forward the event to the bin)
  let [bin, endpoint] = handler.split(/(?<=^[^@]*)@/) as [
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

    info(`Running: \`${bin}\``);

    const cmds = bin.split(" ");
    childProcess = spawn(cmds[0], cmds.slice(1), {
      detached,
      stdio: "inherit",
      env: env,
    });

    if (detached) {
      childProcess.unref();
    }

    log("Started child process", { cmds, pid: childProcess.pid });
  }

  endpoint = endpoint ? new URL(endpoint) : undefined;

  return {
    childProcess,
    bin,
    endpoint,
    wsEndpoint: wsify(endpoint),
  };
};

export const endpointExec = async ({
  requestId,
  bin,
  event,
  deadline,
}: EndpointExecRequest): Promise<EndpointResponse> => {
  const { execa } = await import("execa");

  const timeout = deadline - Date.now();

  info(`Running: \`${bin}\``);

  const subprocess = execa({
    stderr: ["inherit"],
  })`${bin} ${event}`;

  setTimeout(() => {
    subprocess.kill(
      Error(`${bin} took longer than ${timeout} milliseconds to start.`)
    );
  }, timeout);

  const { stdout } = await subprocess;

  const payload = JSON.parse(stdout);

  return {
    requestId,
    payload,
  };
};

export const endpointProxy = async ({
  requestId,
  endpoint,
  event,
  deadline,
}: EndpointProxyRequest): Promise<EndpointResponse> => {
  const rawEvent = JSON.parse(event) as Partial<APIGatewayProxyEventV2>;

  const {
    requestContext,
    rawPath,
    rawQueryString,
    headers: rawHeaders,
    body: rawBody,
    isBase64Encoded,
  } = rawEvent;

  if (!requestContext) {
    throw new Error("No request context found in event");
  }

  const method = requestContext.http.method;

  log("Waiting for endpoint to start", { endpoint, deadline });
  const { timeout } = await waitForEndpoint(endpoint, deadline);

  if (!timeout) {
    throw new Error(
      `${endpoint.toString()} took longer than ${timeout} milliseconds to start.`
    );
  }

  if (!rawPath) {
    throw new Error("No path found in event");
  }

  const url = new URL(rawPath, endpoint);
  if (rawQueryString) {
    url.search = new URLSearchParams(rawQueryString).toString();
  }

  const decodedBody =
    isBase64Encoded && rawBody ? Buffer.from(rawBody, "base64") : rawBody;

  log("Proxying request", { url, method, rawHeaders, timeout });

  let response: AxiosResponse<any, any> | undefined = undefined;
  try {
    response = await axios.request({
      method: method.toLowerCase(),
      url: url.toString(),
      headers: rawHeaders,
      data: decodedBody,
      timeout,
      responseType: "arraybuffer",
    });
  } catch (e) {
    if (isAxiosError(e) && e.response) {
      response = e.response;
    } else {
      throw e;
    }
  }

  if (!response) {
    throw new Error("No response received");
  }

  const { data: rawData, headers: rawResponseHeaders } = response;

  log("Proxy request complete", { url, method, rawResponseHeaders });

  return {
    requestId,
    payload: {
      statusCode: response.status,
      headers: convertHeaders(rawResponseHeaders),
      body: Buffer.from(rawData).toString("base64"),
      isBase64Encoded: true,
    },
  };
};
