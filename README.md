# Host Tools

Concrete host capabilities, declared against the [Tool System](../tool-system) contract, that a model can invoke without any of them reaching the host directly.

## Owns

- Declaration and handler factories for six capabilities: `system_status`, `web_search`, `weather_report`, `open_url`, `set_volume`, `screen_capture`.
- `HttpBroker` — the single network path, allowlisted by host.
- Narrow service interfaces (`SystemProbe`, `VolumeControl`, `ScreenCapture`) with stub implementations for tests.
- `installCatalogue`, which registers only the capabilities whose services a host can actually provide.

## Does not own

- The execution pipeline, policy, guards, and process brokering (Tool System). The model loop (Agent Runtime). Scheduling (Task Core). Smart-home control (Home Bridge). GUI.

## Status

Host Tools v0.1 is complete. No capability imports a process, filesystem, network, or automation primitive — asserted by test across every source file.

## Capabilities

| Tool | Side effect | Notes |
| --- | --- | --- |
| `system_status` | `read_only` | CPU, memory, uptime. No broker involved. |
| `web_search` | `network` | Result marked `external`. |
| `weather_report` | `network` | Enum-restricted cities; result marked `external`. |
| `open_url` | `process_launch` | https only, host allowlisted, URL passed as argv. |
| `set_volume` | `local_state` | Integer 0–100, enforced by schema. |
| `screen_capture` | `read_only` | Returns a `continuation` rather than holding the turn. |

## Not included, and why

Four of Mark L's capabilities are deliberately absent. Each is an effect no boundary in this system can contain, and the reasoning is recorded in [WORKPLAN.md](./WORKPLAN.md) so the absence reads as a decision rather than an oversight:

- `dev_agent`, `desktop_control` — execute model-generated code; an in-process sandbox around a language runtime is escapable.
- `computer_control` — synthesizes keyboard and mouse input, so no declaration can describe its effect and no policy can meaningfully decide about it.
- `send_message` — acts outward under the user's identity; belongs behind a confirmation flow owned by whatever holds that identity.

## Commands

```sh
npm run typecheck
npm test
npm run build
npm run verify

host-tools list
host-tools declarations
```

The CLI cannot execute anything. Running a capability requires services and a policy, both of which belong to whatever assembles a runtime.

## Usage

```ts
const registry = new ToolRegistry();

const report = installCatalogue(registry, {
  system: nodeSystemProbe(),
  http: new AllowlistHttpBroker({ hosts: ["api.example.com"], request }),
  search: { host: "api.example.com", path: (q, mode) => `/search?q=${encodeURIComponent(q)}&mode=${mode}` },
  openUrl: { browser: "firefox", hosts: ["example.com"] },
});

report.installed; // ["system_status", "web_search", "open_url"]
```

Nothing registers by default. A catalogue that installed itself would grant capability by being imported, which is the same failure as a policy that permits by omission.

Part of [Assistant mark I](../README.md).
