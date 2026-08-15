/**
 * screen_capture — the continuation case.
 *
 * Capturing and transferring a screen takes seconds. A capability that blocks
 * for those seconds produces silence, and silence is what makes an assistant
 * feel broken. So this one starts the work and returns a `continuation`: the
 * caller says something now, and the image is delivered on the consumer's own
 * channel against the returned identifier.
 *
 * The pattern is borrowed from Mark L, which discovered it by hearing the dead
 * air. There it is a magic string the model is told to interpret; here it is a
 * declared outcome variant, so every slow capability gets the same treatment
 * without inventing its own convention.
 *
 * A continuation is still synchronous under INV-001: the acknowledgement is
 * immediate and the runtime owns the wait, so this stays a host tool rather
 * than becoming a delegated capability.
 * ADR 0001 — docs/decisions/0001-factories-not-stateful-modules.md
 */

import { toolError, type ExecutionOutcome, type ToolDeclaration, type ToolHandler } from "tool-system";

import type { ScreenCapture } from "../services.js";

export function screenCaptureDeclaration(): ToolDeclaration {
  return {
    name: "screen_capture",
    version: "0.1.0",
    description:
      "Captures what is currently on screen so it can be looked at. Call once and wait; the image is delivered separately.",
    parameters: {
      question: {
        type: "string",
        description: "What should be looked for in the capture.",
        maxLength: 300,
      },
    },
    required: ["question"],
    sideEffect: "read_only",
    guards: {
      timeoutMs: 8_000,
      maxConcurrent: 1,
      // Speaking about the screen can prompt a second request for the same
      // screen. Four seconds absorbs that without blocking a real follow-up.
      cooldownMs: 4_000,
    },
  };
}

export function screenCaptureHandler(capture: ScreenCapture): ToolHandler {
  return async (_args, context): Promise<ExecutionOutcome> => {
    try {
      const handle = await capture.begin(context.signal);
      return {
        kind: "continuation",
        continuationId: handle.captureId,
        acknowledgement: "Looking at your screen now.",
      };
    } catch {
      return { kind: "error", error: toolError("execution_failed", "The screen could not be captured.") };
    }
  };
}
