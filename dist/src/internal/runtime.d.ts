import { LambdaEvent } from "./types";
export declare const nextEvent: (runtimeApi: string) => Promise<LambdaEvent>;
export declare const respondToEvent: (runtimeApi: string, requestId: string, payload: any) => Promise<void>;
