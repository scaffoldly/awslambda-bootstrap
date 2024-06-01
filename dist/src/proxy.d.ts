/// <reference types="node" />
import { EndpointExecRequest, EndpointProxyRequest, EndpointResponse } from "./types";
import { ChildProcess } from "child_process";
export declare const endpointSpawn: (handler: string, offline: boolean) => Promise<{
    childProcess?: ChildProcess;
    bin?: string;
    endpoint?: URL;
}>;
export declare const endpointExec: ({ requestId, bin, event, deadline, }: EndpointExecRequest) => Promise<EndpointResponse>;
export declare const endpointProxy: ({ requestId, endpoint, event, deadline, }: EndpointProxyRequest) => Promise<EndpointResponse>;
//# sourceMappingURL=proxy.d.ts.map