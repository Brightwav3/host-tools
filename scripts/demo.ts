/**
 * Runs the cheap capabilities for real.
 *
 * The CLI deliberately cannot execute anything, because executing needs
 * services and a policy and both belong to whatever assembles a runtime. This
 * script is that assembler, kept small enough to read in one sitting: it wires
 * the effect-free capabilities to a real host, permits exactly those, and runs
 * them. Everything with an effect on the world is left out on purpose.
 */

import {
  AllowlistPolicy,
  ToolRegistry,
  ToolRuntime,
  type ExecutionOutcome,
} from "tool-system";

import { installCatalogue, nodeSystemProbe, nodeUptimeSource } from "../src/index.js";

const PERMITTED = ["get_time", "calculate", "uptime", "system_status"];

function render(outcome: ExecutionOutcome): string {
  switch (outcome.kind) {
    case "result": return outcome.content;
    case "silent": return "(done, nothing to say)";
    case "continuation": return `${outcome.acknowledgement} [${outcome.continuationId}]`;
    case "lifecycle": return `host asked to ${outcome.action}: ${outcome.reason}`;
    case "error": return `${outcome.error.code}: ${outcome.error.message}`;
  }
}

async function main(): Promise<void> {
  const registry = new ToolRegistry();
  const report = installCatalogue(registry, {
    uptime: nodeUptimeSource(),
    system: nodeSystemProbe(),
  });

  const runtime = new ToolRuntime({
    registry,
    policy: new AllowlistPolicy({ allow: PERMITTED }),
  });
  await runtime.start();

  console.log(`installed: ${report.installed.join(", ")}\n`);

  const requests = [
    { tool: "get_time", args: {} },
    { tool: "uptime", args: {} },
    { tool: "system_status", args: {} },
    { tool: "calculate", args: { left: 17, operator: "multiply", right: 23 } },
    { tool: "calculate", args: { left: 1, operator: "divide", right: 0 } },
    { tool: "calculate", args: { left: 1, operator: "eval", right: 1 } },
    { tool: "open_url", args: { url: "https://example.com" } },
  ] as const;

  for (const request of requests) {
    const result = await runtime.execute(request);
    const shown = Object.keys(request.args).length > 0 ? ` ${JSON.stringify(request.args)}` : "";
    console.log(`${request.tool}${shown}\n  -> ${render(result.outcome)}\n`);
  }

  await runtime.stop();
}

await main();
