import { APIGatewayProxyResult } from "aws-lambda";
import { ChildProcess } from "child_process";

export type SpawnResult = {
  childProcess?: ChildProcess;
  bin?: string;
  endpoint?: URL;
  wsEndpoint?: URL;
};

export type RuntimeEvent = {
  requestId: string;
  event: string;
  deadline: number;
};

export type EndpointExecRequest = {
  requestId: string;
  bin: string;
  event: string;
  deadline: number;
};

export type EndpointProxyRequest = {
  requestId: string;
  endpoint: URL;
  event: string;
  deadline: number;
};

export type EndpointResponse = {
  requestId: string;
  // TODO: support results to different invokers
  payload: APIGatewayProxyResult;
};
