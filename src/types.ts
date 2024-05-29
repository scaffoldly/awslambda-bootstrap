export type EndpointRequest = {
  requestId: string;
  endpoint: URL;
  event: any;
  initialDeadline: number;
};

export type EndpointResponse = {
  requestId: string;
  payload: any;
};
