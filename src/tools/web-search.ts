/**
 * web_search and weather_report — network capabilities.
 *
 * Both return content the host did not author, so both mark their results
 * `external`. That marking is the whole reason these are worth having in the
 * catalogue early: they are the first capabilities whose output must not be
 * allowed to read as instruction.
 */

import { toolError, type ExecutionOutcome, type ToolDeclaration, type ToolHandler } from "tool-system";

import { HttpRejection, type HttpBroker } from "../services.js";

const SEARCH_MODES = ["search", "news", "research"] as const;

export function webSearchDeclaration(): ToolDeclaration {
  return {
    name: "web_search",
    version: "0.1.0",
    description:
      "Searches the web for current information. Use for anything time-sensitive rather than answering from memory.",
    parameters: {
      query: { type: "string", description: "What to search for.", maxLength: 300 },
      mode: {
        type: "string",
        description: "search for general results, news for recent headlines, research for a fuller answer.",
        enum: [...SEARCH_MODES],
      },
    },
    required: ["query"],
    sideEffect: "network",
    guards: { timeoutMs: 15_000, maxConcurrent: 2, cooldownMs: 500 },
  };
}

export interface WebSearchConfig {
  readonly host: string;
  /** Builds the request path. Kept injectable so the provider is a configuration choice, not a code change. */
  readonly path: (query: string, mode: string) => string;
}

export function webSearchHandler(broker: HttpBroker, config: WebSearchConfig): ToolHandler {
  return async (args, context): Promise<ExecutionOutcome> => {
    const query = String(args.query);
    const mode = typeof args.mode === "string" ? args.mode : "search";

    try {
      const response = await broker.get(config.host, config.path(query, mode), context.signal);

      if (response.status !== 200) {
        return {
          kind: "error",
          error: toolError("execution_failed", "The search provider returned an error.", {
            status: response.status,
          }),
        };
      }

      return { kind: "result", content: response.body, taint: "external" };
    } catch (cause) {
      if (cause instanceof HttpRejection) {
        return { kind: "error", error: cause.toolError };
      }
      return { kind: "error", error: toolError("execution_failed", "The search request failed.") };
    }
  };
}

export function weatherDeclaration(cities: readonly string[]): ToolDeclaration {
  const known = [...cities].sort();

  return {
    name: "weather_report",
    version: "0.1.0",
    description: "Reports current weather for a known city.",
    parameters: {
      city: {
        type: "string",
        description: `City to report on. One of: ${known.join(", ")}.`,
        enum: known,
      },
    },
    required: ["city"],
    sideEffect: "network",
    guards: { timeoutMs: 10_000, cooldownMs: 1_000, idempotencyWindowMs: 60_000 },
  };
}

export interface WeatherConfig {
  readonly host: string;
  readonly path: (city: string) => string;
}

export function weatherHandler(broker: HttpBroker, config: WeatherConfig): ToolHandler {
  return async (args, context): Promise<ExecutionOutcome> => {
    const city = String(args.city);

    try {
      const response = await broker.get(config.host, config.path(city), context.signal);
      if (response.status !== 200) {
        return {
          kind: "error",
          error: toolError("execution_failed", "The weather provider returned an error.", {
            status: response.status,
          }),
        };
      }
      return { kind: "result", content: response.body, taint: "external" };
    } catch (cause) {
      if (cause instanceof HttpRejection) {
        return { kind: "error", error: cause.toolError };
      }
      return { kind: "error", error: toolError("execution_failed", "The weather request failed.") };
    }
  };
}
