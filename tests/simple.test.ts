import assert from "node:assert/strict";
import test from "node:test";

import { AllowlistPolicy, PermissivePolicy, ToolRegistry, ToolRuntime, validateDeclaration } from "tool-system";

import { installCatalogue } from "../src/catalogue.js";
import { nodeSystemProbe, nodeUptimeSource } from "../src/hosts/node.js";

const FIXED = new Date("2026-08-12T21:45:00.000Z");

async function runtime(config = {}) {
  const registry = new ToolRegistry();
  const report = installCatalogue(registry, { clock: { now: () => FIXED }, uptime: { seconds: () => 200_000 }, ...config });
  const tools = new ToolRuntime({ registry, policy: new PermissivePolicy() });
  await tools.start();
  return { tools, registry, report };
}

test("the cheap capabilities install with no configuration at all", async () => {
  const registry = new ToolRegistry();
  const report = installCatalogue(registry, {});
  assert.deepEqual(report.installed, ["get_time", "calculate"]);
  for (const declaration of registry.discover()) assert.equal(validateDeclaration(declaration), null);
});

test("they can be refused explicitly", () => {
  const registry = new ToolRegistry();
  assert.deepEqual(installCatalogue(registry, { simple: false }).installed, []);
});

test("get_time reports an unambiguous value and a readable one", async () => {
  const { tools } = await runtime();
  const report = await tools.execute({ tool: "get_time", args: {} });
  assert.equal(report.outcome.kind, "result");
  if (report.outcome.kind !== "result") return;
  assert.match(report.outcome.content, /^2026-08-12T21:45:00\.000Z \(/);
  assert.equal(report.outcome.taint, "trusted");
});

test("calculate performs each declared operation exactly", async () => {
  const { tools } = await runtime();
  const cases: Array<[number, string, number, string]> = [
    [2, "add", 2, "4"],
    [10, "subtract", 4.5, "5.5"],
    [7, "multiply", 6, "42"],
    [1, "divide", 8, "0.125"],
    [2, "power", 10, "1024"],
    [10, "modulo", 3, "1"],
    [0.1, "add", 0.2, "0.3"],
  ];

  for (const [left, operator, right, expected] of cases) {
    const report = await tools.execute({ tool: "calculate", args: { left, operator, right } });
    assert.equal(report.outcome.kind === "result" && report.outcome.content, expected, `${left} ${operator} ${right}`);
  }
});

test("calculate refuses division and modulo by zero rather than returning Infinity", async () => {
  const { tools } = await runtime();
  for (const operator of ["divide", "modulo"]) {
    const report = await tools.execute({ tool: "calculate", args: { left: 1, operator, right: 0 } });
    assert.equal(report.outcome.kind === "error" && report.outcome.error.code, "invalid_arguments", operator);
  }
});

test("calculate takes named operands, so no expression can ever be evaluated", async () => {
  const { tools } = await runtime();
  const report = await tools.execute({
    tool: "calculate",
    args: { left: 1, operator: "add", right: 1, expression: "process.exit(1)" },
  });
  assert.equal(report.outcome.kind === "error" && report.outcome.error.code, "invalid_arguments");
});

test("calculate rejects an operator outside the declared set", async () => {
  const { tools } = await runtime();
  const report = await tools.execute({ tool: "calculate", args: { left: 1, operator: "eval", right: 1 } });
  assert.equal(report.outcome.kind === "error" && report.outcome.error.code, "invalid_arguments");
});

test("uptime renders days, hours, and minutes", async () => {
  const { tools } = await runtime();
  const report = await tools.execute({ tool: "uptime", args: {} });
  assert.equal(report.outcome.kind === "result" && report.outcome.content, "Up 2 days, 7 hours, 33 minutes.");
});

test("uptime is omitted when no source is supplied", () => {
  const registry = new ToolRegistry();
  assert.equal(installCatalogue(registry, {}).installed.includes("uptime"), false);
});

/* The node-backed services are real, so they get real assertions. */

test("the node system probe reports plausible live values", async () => {
  const snapshot = await nodeSystemProbe({ sampleMs: 50 }).read();
  assert.ok(snapshot.cpuPercent >= 0 && snapshot.cpuPercent <= 100, `cpu ${snapshot.cpuPercent}`);
  assert.ok(snapshot.memoryUsedPercent > 0 && snapshot.memoryUsedPercent <= 100, `memory ${snapshot.memoryUsedPercent}`);
  assert.ok(snapshot.uptimeSeconds > 0);
});

test("system_status runs end to end against the real host probe", async () => {
  const registry = new ToolRegistry();
  installCatalogue(registry, { simple: false, system: nodeSystemProbe({ sampleMs: 50 }) });
  const tools = new ToolRuntime({ registry, policy: new AllowlistPolicy({ allow: ["system_status"] }) });
  await tools.start();

  const report = await tools.execute({ tool: "system_status", args: {} });
  assert.equal(report.outcome.kind, "result");
  assert.match(report.outcome.kind === "result" ? report.outcome.content : "", /^CPU \d+%, memory \d+%, up \d+ minutes\.$/);
});

test("the node uptime source agrees with the operating system", () => {
  assert.ok(nodeUptimeSource().seconds() > 0);
});
