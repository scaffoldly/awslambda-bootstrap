import { APIGatewayProxyResult } from "aws-lambda";
export type LambdaEvent = {
    requestId: string;
    event: any;
    deadline: number;
};
export type EndpointExecRequest = {
    requestId: string;
    bin: string;
    event: any;
    deadline: number;
};
export type EndpointProxyRequest = {
    requestId: string;
    endpoint: URL;
    event: any;
    deadline: number;
};
export type EndpointResponse = {
    requestId: string;
    payload: APIGatewayProxyResult;
};
//# sourceMappingURL=types.d.ts.map