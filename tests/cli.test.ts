import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);

async function cli(args: readonly string[]): Promise<{ code: number; json: any }> {
  try {
    const { stdout } = await run("node", ["--import", "tsx", "cli/main.ts", ...args]);
    return { code: 0, json: JSON.parse(stdout.trim()) };
  } catch (cause) {
    const error = cause as { code?: number; stdout?: string };
    return { code: error.code ?? -1, json: JSON.parse((error.stdout ?? "{}").trim()) };
  }
}

test("list reports every capability the catalogue can install", async () => {
  const { code, json } = await cli(["list"]);
  assert.equal(code, 0);
  assert.equal(json.name, "host-tools");
  assert.equal(json.installed.length, 6);
  assert.deepEqual(json.failed, []);
});

test("declarations exposes full schemas so an agent need not guess parameters", async () => {
  const { json } = await cli(["declarations"]);
  const byName = Object.fromEntries(json.tools.map((tool: any) => [tool.name, tool]));

  assert.deepEqual(byName.web_search.parameters.mode.enum, ["search", "news", "research"]);
  assert.equal(byName.set_volume.parameters.percent.maximum, 100);
  assert.equal(byName.system_status.sideEffect, "read_only");
  assert.equal(byName.open_url.sideEffect, "process_launch");
});

test("an unknown command lists the known ones", async () => {
  const { code, json } = await cli(["run"]);
  assert.equal(code, 2);
  assert.deepEqual(json.error.known, ["list", "declarations"]);
});

test("the CLI offers no way to execute a capability", async () => {
  const { code, json } = await cli(["execute", "open_url"]);
  assert.equal(code, 2);
  assert.equal(json.error.code, "unknown_command");
});
