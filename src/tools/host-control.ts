/**
 * open_url and set_volume — direct host effects.
 *
 * Both are the kind of capability that, done carelessly, becomes a way to run
 * anything: Mark L's equivalent composes a shell string from a spoken argument
 * and falls back to typing into the Start menu. Here `open_url` hands a browser
 * an argv array containing a URL whose host was checked against a catalogue,
 * and `set_volume` can only move one number inside a declared range.
 */

import { toolError, type ExecutionOutcome, type ToolDeclaration, type ToolHandler } from "tool-system";

import type { VolumeControl } from "../services.js";

export interface OpenUrlConfig {
  /** Browser executable the process broker must have allowlisted. */
  readonly browser: string;
  /** Hosts that may be opened. A URL is a navigation instruction, so its target is checked like any other. */
  readonly hosts: readonly string[];
}

export function openUrlDeclaration(config: OpenUrlConfig): ToolDeclaration {
  return {
    name: "open_url",
    version: "0.1.0",
    description: `Opens a web address in the browser. Permitted hosts: ${[...config.hosts].sort().join(", ")}.`,
    parameters: {
      url: {
        type: "string",
        description: "Full https address to open.",
        maxLength: 500,
      },
    },
    required: ["url"],
    sideEffect: "process_launch",
    guards: { timeoutMs: 10_000, maxConcurrent: 1, cooldownMs: 2_000 },
  };
}

export function openUrlHandler(config: OpenUrlConfig): ToolHandler {
  const permitted = new Set(config.hosts);

  return async (args, context): Promise<ExecutionOutcome> => {
    const raw = String(args.url);

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return { kind: "error", error: toolError("invalid_arguments", "The address is not a valid URL.") };
    }

    if (parsed.protocol !== "https:") {
      return {
        kind: "error",
        error: toolError("policy_denied", "Only https addresses may be opened.", {
          protocol: parsed.protocol,
        }),
      };
    }

    if (!permitted.has(parsed.hostname)) {
      return {
        kind: "error",
        error: toolError("policy_denied", "That host is not in the permitted list.", {
          host: parsed.hostname,
        }),
      };
    }

    const broker = context.services.process;
    if (broker === undefined) {
      return { kind: "error", error: toolError("broker_rejected", "No process broker is available.") };
    }

    await broker.launch(config.browser, [parsed.toString()], context.signal);
    return { kind: "result", content: `Opened ${parsed.hostname}.`, taint: "trusted" };
  };
}

export function setVolumeDeclaration(): ToolDeclaration {
  return {
    name: "set_volume",
    version: "0.1.0",
    description: "Sets the system output volume to a percentage.",
    parameters: {
      percent: {
        type: "integer",
        description: "Target volume from 0 to 100.",
        minimum: 0,
        maximum: 100,
      },
    },
    required: ["percent"],
    sideEffect: "local_state",
    guards: { timeoutMs: 3_000, cooldownMs: 250 },
  };
}

export function setVolumeHandler(volume: VolumeControl): ToolHandler {
  return async (args): Promise<ExecutionOutcome> => {
    const percent = Number(args.percent);

    try {
      await volume.set(percent);
      return { kind: "result", content: `Volume set to ${percent}%.`, taint: "trusted" };
    } catch {
      return { kind: "error", error: toolError("execution_failed", "The volume could not be changed.") };
    }
  };
}
