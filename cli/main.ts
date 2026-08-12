#!/usr/bin/env node
/**
 * Host Tools diagnostic CLI.
 *
 * Lists what the catalogue declares. It deliberately cannot execute anything:
 * running a capability requires services and a policy, and both belong to
 * whatever assembles a runtime. A diagnostic surface that could act would be a
 * second way to reach the host, next to the one that is actually governed.
 */

import { ToolRegistry } from "tool-system";

import { CATALOGUE_VERSION, PACKAGE_NAME, installCatalogue } from "../src/index.js";

/** Stub services: enough to produce every declaration, incapable of any effect. */
const INERT = {
  clock: { now: () => new Date(0) },
  uptime: { seconds: () => 0 },
  system: { read: async () => ({ cpuPercent: 0, memoryUsedPercent: 0, uptimeSeconds: 0 }) },
  volume: { set: async () => {} },
  screen: { begin: async () => ({ captureId: "" }) },
  http: { get: async () => ({ status: 0, body: "" }) },
  search: { host: "example.invalid", path: () => "/" },
  weather: { host: "example.invalid", path: () => "/", cities: ["prague"] },
  openUrl: { browser: "browser", hosts: ["example.invalid"] },
};

function emit(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function main(argv: readonly string[]): number {
  const command = argv[2];
  const registry = new ToolRegistry();
  const report = installCatalogue(registry, INERT);

  switch (command) {
    case "list": {
      emit({
        name: PACKAGE_NAME,
        catalogueVersion: CATALOGUE_VERSION,
        installed: report.installed,
        failed: report.failed,
      });
      return 0;
    }

    case "declarations": {
      emit({ tools: registry.discover() });
      return 0;
    }

    default: {
      emit({ error: { code: "unknown_command", command: command ?? null, known: ["list", "declarations"] } });
      return 2;
    }
  }
}

process.exitCode = main(process.argv);
