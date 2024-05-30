export type EndpointRequest = {
  requestId: string;
  endpoint: URL;
  event: any;
  deadline: number;
};

export type EndpointResponse = {
  requestId: string;
  payload: any;
};
