/**
 * Node-backed service implementations.
 *
 * This is the one place in the repository permitted to import a platform
 * module, and it exists so the rest of the catalogue never has to. Every
 * capability takes a service interface; this file provides the real thing for a
 * Node host. Swap it for another implementation and no capability changes.
 *
 * Keeping the platform in a single file is what makes the import audit
 * meaningful: "no capability touches the host directly" is checkable by reading
 * one directory rather than trusting every handler.
 */

import { cpus, freemem, totalmem, uptime } from "node:os";

import type { SystemProbe, SystemSnapshot } from "../services.js";
import type { UptimeSource } from "../tools/simple.js";

/**
 * CPU load sampled across two readings.
 *
 * A single reading of the OS counters gives load since boot, which is close to
 * meaningless when someone asks how busy the machine is now. Two readings a
 * short interval apart give the interval's actual load.
 */
function cpuTimes(): { idle: number; total: number } {
  let idle = 0;
  let total = 0;
  for (const cpu of cpus()) {
    idle += cpu.times.idle;
    total += cpu.times.idle + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq;
  }
  return { idle, total };
}

export interface NodeSystemProbeOptions {
  /** How long to sample CPU load. Kept short so the tool stays inside its timeout. */
  readonly sampleMs?: number;
}

export function nodeSystemProbe(options: NodeSystemProbeOptions = {}): SystemProbe {
  const sampleMs = options.sampleMs ?? 200;

  return {
    async read(): Promise<SystemSnapshot> {
      const first = cpuTimes();
      await new Promise((resolve) => setTimeout(resolve, sampleMs));
      const second = cpuTimes();

      const idleDelta = second.idle - first.idle;
      const totalDelta = second.total - first.total;
      const cpuPercent = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;

      const total = totalmem();
      const memoryUsedPercent = total > 0 ? ((total - freemem()) / total) * 100 : 0;

      return { cpuPercent, memoryUsedPercent, uptimeSeconds: uptime() };
    },
  };
}

export function nodeUptimeSource(): UptimeSource {
  return { seconds: () => uptime() };
}
