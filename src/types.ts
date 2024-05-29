export type EndpointRequest = {
  requestId: string;
  endpoint: string;
  event: any;
  initialDeadline: number;
};

export type EndpointResponse = {
  requestId: string;
  payload: any;
};
