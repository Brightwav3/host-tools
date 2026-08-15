/**
 * system_status — read-only host telemetry.
 *
 * The cheapest capability in the catalogue, and the one that proves a tool with
 * no host effect travels the same pipeline as one that launches a process. Its
 * side-effect class is `read_only`, so a policy can permit it without
 * permitting anything else.
 *
 * ADR 0001 — docs/decisions/0001-factories-not-stateful-modules.md
 */

import { toolError, type ExecutionOutcome, type ToolDeclaration, type ToolHandler } from "tool-system";

import type { SystemProbe } from "../services.js";

export function systemStatusDeclaration(): ToolDeclaration {
  return {
    name: "system_status",
    version: "0.1.0",
    description:
      "Reports current CPU load, memory use, and uptime for this machine. Use when asked about performance or resource usage.",
    parameters: {},
    required: [],
    sideEffect: "read_only",
    guards: { timeoutMs: 2_000, cooldownMs: 1_000 },
  };
}

export function systemStatusHandler(probe: SystemProbe): ToolHandler {
  return async (): Promise<ExecutionOutcome> => {
    try {
      const snapshot = await probe.read();
      const minutes = Math.round(snapshot.uptimeSeconds / 60);
      return {
        kind: "result",
        // Telemetry read from this host is not external content.
        taint: "trusted",
        content: `CPU ${snapshot.cpuPercent.toFixed(0)}%, memory ${snapshot.memoryUsedPercent.toFixed(0)}%, up ${minutes} minutes.`,
      };
    } catch {
      return {
        kind: "error",
        error: toolError("execution_failed", "System telemetry could not be read."),
      };
    }
  };
}
