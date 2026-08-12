/**
 * Host services.
 *
 * Every effect a capability can have on the world arrives through one of these
 * interfaces. A capability never imports `child_process`, `fs`, `fetch`, or an
 * automation library, which is what makes the whole catalogue testable without
 * a host and auditable without reading every handler.
 */

import { toolError, type ToolError } from "tool-system";

/* ------------------------------------------------------------------ *
 * Network
 * ------------------------------------------------------------------ */

export interface HttpResponse {
  readonly status: number;
  readonly body: string;
}

/**
 * The only network path, allowlisted by host.
 *
 * A capability supplies a host and a path, never a full URL, so it cannot
 * redirect itself somewhere the allowlist does not cover. This is the network
 * equivalent of the process broker refusing shell strings: the caller supplies
 * parts, not a composed instruction.
 */
export interface HttpBroker {
  get(host: string, path: string, signal: AbortSignal): Promise<HttpResponse>;
}

export class HttpRejection extends Error {
  readonly toolError: ToolError;

  constructor(error: ToolError) {
    super(error.message);
    this.name = "HttpRejection";
    this.toolError = error;
  }
}

export interface AllowlistHttpBrokerConfig {
  readonly hosts: readonly string[];
  readonly request: (url: string, signal: AbortSignal) => Promise<HttpResponse>;
}

export class AllowlistHttpBroker implements HttpBroker {
  readonly #hosts: ReadonlySet<string>;
  readonly #request: AllowlistHttpBrokerConfig["request"];

  constructor(config: AllowlistHttpBrokerConfig) {
    this.#hosts = new Set(config.hosts);
    this.#request = config.request;
  }

  async get(host: string, path: string, signal: AbortSignal): Promise<HttpResponse> {
    if (!this.#hosts.has(host)) {
      throw new HttpRejection(
        toolError("broker_rejected", "Host is not permitted by the network broker.", { host }),
      );
    }
    if (!path.startsWith("/")) {
      throw new HttpRejection(
        toolError("broker_rejected", "Path must be absolute.", { host }),
      );
    }
    if (signal.aborted) {
      throw new HttpRejection(toolError("cancelled", "Cancelled before the request was made."));
    }
    return this.#request(`https://${host}${path}`, signal);
  }
}

/* ------------------------------------------------------------------ *
 * Local host
 * ------------------------------------------------------------------ */

export interface SystemSnapshot {
  readonly cpuPercent: number;
  readonly memoryUsedPercent: number;
  readonly uptimeSeconds: number;
}

/** Read-only host telemetry. Deliberately has no setter of any kind. */
export interface SystemProbe {
  read(): Promise<SystemSnapshot>;
}

/**
 * Output volume. Narrow on purpose: a capability that can set a level cannot
 * also mute, reboot, or reach anything else, so the declaration and the
 * available effect stay the same size.
 */
export interface VolumeControl {
  set(percent: number): Promise<void>;
}

export interface CaptureHandle {
  /** Correlates the eventual image with the acknowledgement already spoken. */
  readonly captureId: string;
}

/**
 * Screen capture, started rather than awaited.
 *
 * Capturing and transferring a screen takes long enough that a caller waiting
 * on it produces dead air. The capability starts the work and returns a handle;
 * delivery is the consumer's channel, not this one's.
 */
export interface ScreenCapture {
  begin(signal: AbortSignal): Promise<CaptureHandle>;
}
