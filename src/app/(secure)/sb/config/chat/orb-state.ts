export function getToolStepStatus(state: string): "complete" | "active" | "pending" {
  if (state === "output-available" || state === "output-error" || state === "output-denied") {
    return "complete";
  }
  if (state === "input-streaming" || state === "input-available") {
    return "active";
  }
  return "pending";
}
