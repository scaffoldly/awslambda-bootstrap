import axios from "axios";
import { LambdaEvent } from "./types";

export const nextEvent = async (runtimeApi: string): Promise<LambdaEvent> => {
  const { headers, data } = await axios.get(
    `http://${runtimeApi}/2018-06-01/runtime/invocation/next`,
    {
      // block indefinitely until a response is received
      timeout: 0,
      responseType: "text",
    }
  );

  const requestId = headers["lambda-runtime-aws-request-id"];

  if (!requestId) {
    throw new Error("No request ID found in response headers");
  }

  const deadline = Number.parseInt(headers["lambda-runtime-deadline-ms"]);

  const event = JSON.parse(data);

  return { requestId, event, deadline };
};

export const respondToEvent = async (
  runtimeApi: string,
  requestId: string,
  payload: any
): Promise<void> => {
  await axios.post(
    `http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/response`,
    payload
  );
};
