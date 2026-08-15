/**
 * Cheap capabilities.
 *
 * Each one answers from something already in the process: the clock, the
 * operating system's own counters, the arguments themselves. No network, no
 * process launch, no service to configure. They cost almost nothing to run and
 * nothing to set up, which makes them the ones worth having first — a catalogue
 * where every entry needs wiring is a catalogue nobody turns on.
 *
 * All of them are `read_only`, so a policy can permit the whole group without
 * permitting anything that touches the world.
 *
 * ADR 0001 — docs/decisions/0001-factories-not-stateful-modules.md
 */

import { toolError, type ExecutionOutcome, type ToolDeclaration, type ToolHandler } from "tool-system";

/* ------------------------------------------------------------------ *
 * get_time
 * ------------------------------------------------------------------ */

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export function getTimeDeclaration(): ToolDeclaration {
  return {
    name: "get_time",
    version: "0.1.0",
    description:
      "Reports the current date and time on this machine. Use whenever the answer depends on what time it is now, including working out how long until something.",
    parameters: {},
    required: [],
    sideEffect: "read_only",
    guards: { timeoutMs: 1_000 },
  };
}

export function getTimeHandler(clock: Clock = systemClock): ToolHandler {
  return async (): Promise<ExecutionOutcome> => {
    const now = clock.now();
    // ISO alongside the readable form: a model reasoning about durations needs
    // an unambiguous value, a person hearing the answer needs the other one.
    return {
      kind: "result",
      taint: "trusted",
      content: `${now.toISOString()} (${now.toDateString()}, ${now.toTimeString().slice(0, 8)})`,
    };
  };
}

/* ------------------------------------------------------------------ *
 * calculate
 * ------------------------------------------------------------------ */

const NUMERIC = /^-?\d+(\.\d+)?$/;

export function calculateDeclaration(): ToolDeclaration {
  return {
    name: "calculate",
    version: "0.1.0",
    description:
      "Performs one exact arithmetic operation on two numbers. Use instead of doing arithmetic yourself when the result must be exact.",
    parameters: {
      left: { type: "number", description: "First operand." },
      operator: {
        type: "string",
        description: "The operation to perform.",
        enum: ["add", "subtract", "multiply", "divide", "power", "modulo"],
      },
      right: { type: "number", description: "Second operand." },
    },
    required: ["left", "operator", "right"],
    sideEffect: "read_only",
    guards: { timeoutMs: 1_000 },
  };
}

/**
 * Arithmetic by named operation rather than by expression string.
 *
 * An expression parameter would need an evaluator, and an evaluator over
 * model-supplied text is the exact shape that makes a calculator into a code
 * execution capability. Three declared parameters cannot become anything else.
 */
export function calculateHandler(): ToolHandler {
  return async (args): Promise<ExecutionOutcome> => {
    const left = Number(args.left);
    const right = Number(args.right);
    const operator = String(args.operator);

    if (operator === "divide" && right === 0) {
      return { kind: "error", error: toolError("invalid_arguments", "Division by zero is undefined.") };
    }
    if (operator === "modulo" && right === 0) {
      return { kind: "error", error: toolError("invalid_arguments", "Modulo by zero is undefined.") };
    }

    const value =
      operator === "add" ? left + right
      : operator === "subtract" ? left - right
      : operator === "multiply" ? left * right
      : operator === "divide" ? left / right
      : operator === "power" ? left ** right
      : left % right;

    if (!Number.isFinite(value)) {
      return {
        kind: "error",
        error: toolError("execution_failed", "The result is not a finite number."),
      };
    }

    // Trailing-zero trimming keeps 2 + 2 reading as 4 rather than 4.000000.
    const rendered = String(Number(value.toPrecision(15)));
    return { kind: "result", taint: "trusted", content: NUMERIC.test(rendered) ? rendered : String(value) };
  };
}

/* ------------------------------------------------------------------ *
 * uptime
 * ------------------------------------------------------------------ */

export interface UptimeSource {
  seconds(): number;
}

export function uptimeDeclaration(): ToolDeclaration {
  return {
    name: "uptime",
    version: "0.1.0",
    description: "Reports how long this machine has been running.",
    parameters: {},
    required: [],
    sideEffect: "read_only",
    guards: { timeoutMs: 1_000 },
  };
}

export function uptimeHandler(source: UptimeSource): ToolHandler {
  return async (): Promise<ExecutionOutcome> => {
    const total = Math.max(0, Math.floor(source.seconds()));
    const days = Math.floor(total / 86_400);
    const hours = Math.floor((total % 86_400) / 3_600);
    const minutes = Math.floor((total % 3_600) / 60);

    const parts = [
      ...(days > 0 ? [`${days} day${days === 1 ? "" : "s"}`] : []),
      ...(hours > 0 ? [`${hours} hour${hours === 1 ? "" : "s"}`] : []),
      `${minutes} minute${minutes === 1 ? "" : "s"}`,
    ];

    return { kind: "result", taint: "trusted", content: `Up ${parts.join(", ")}.` };
  };
}
