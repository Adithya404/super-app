import { DevToolsTelemetry } from "@ai-sdk/devtools";
import { registerTelemetry } from "ai";

export function register() {
  registerTelemetry(DevToolsTelemetry());
}
