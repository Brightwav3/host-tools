# Host Tools

Concrete capabilities, declared against the [Tool System](../tool-system) contract, that a model can invoke without any of them reaching the host directly.

Tool System defines what a tool *is* — schema, outcomes, guards, policy, brokered execution. This repository defines what the tools *are*.

## Owns

- Declaration and handler factories for every capability in the catalogue.
- `HttpBroker` — the single network path, allowlisted by host.
- Narrow service interfaces (`SystemProbe`, `VolumeControl`, `ScreenCapture`, `Clock`, `UptimeSource`) and their Node-backed implementations.
- `installCatalogue`, which registers only the capabilities whose services a host can actually provide.

## Does not own

The execution pipeline, policy decisions, guards, and process brokering (Tool System). The model loop (Agent Runtime). Scheduling that outlives the process (Task Core). Smart-home control (Home Bridge). GUI.

## Status

Host Tools v0.1 is complete: nine capabilities, 33 offline tests, one runtime dependency. No capability imports a platform module — every one reaches the host through an injected service, asserted by a test that reads every source file.

## Available now

Two of these install with no configuration at all, because they have no service to act through. Everything else needs the host to hand it the means.

| Tool | Side effect | Needs | Notes |
| --- | --- | --- | --- |
| `get_time` | `read_only` | — | ISO plus a readable form; a model reasoning about durations needs the unambiguous one. |
| `calculate` | `read_only` | — | One named operation on two numbers. Not an expression — see below. |
| `uptime` | `read_only` | `UptimeSource` | How long the machine has been running. |
| `system_status` | `read_only` | `SystemProbe` | CPU sampled across two readings, memory, uptime. |
| `web_search` | `network` | `HttpBroker` | Result marked `external`. |
| `weather_report` | `network` | `HttpBroker` | Enum-restricted cities; result marked `external`. |
| `open_url` | `process_launch` | `ProcessBroker` | https only, host allowlisted, URL passed as argv. |
| `set_volume` | `local_state` | `VolumeControl` | Integer 0–100, enforced by the schema. |
| `screen_capture` | `read_only` | `ScreenCapture` | Returns a `continuation` rather than holding the turn. |

`open_app` lives in Tool System as its reference tool and is not duplicated here.

**Why `calculate` takes three parameters instead of an expression.** An `expression` parameter needs an evaluator, and an evaluator over model-supplied text is exactly how a calculator becomes a code-execution capability. `left`, `operator`, `right` cannot become anything else.

## Planned

Ordered by what each one unlocks rather than by difficulty. Nothing here is scheduled; the list exists so a later reader knows what shape the catalogue is growing into, and so a capability that does not fit gets noticed.

### Next — cheap, and each proves something new

| Tool | Side effect | Unlocks |
| --- | --- | --- |
| `disk_space` | `read_only` | Completes the machine-telemetry set alongside `system_status`. |
| `battery` | `read_only` | First capability that is absent on some hosts, exercising partial installation for real. |
| `clipboard_read` | `read_only` | First capability returning content the user put there — `external` taint on local data. |
| `clipboard_write` | `local_state` | First write of any kind, and the smallest one worth gating. |
| `list_windows` | `read_only` | Lets the assistant know what is open before being asked to act on it. |

### Later — each needs a broker that does not exist yet

| Tool | Needs | Why it waits |
| --- | --- | --- |
| `read_file`, `summarize_file` | A filesystem broker with a path allowlist | Reading arbitrary paths is the same class of problem as launching arbitrary executables, and deserves the same treatment. |
| `write_file` | The same broker, plus confirmation | A write that cannot be undone should not be a silent success. |
| `play_media`, `pause_media` | Media control service | Small, but platform-specific enough to belong behind an interface. |
| `set_brightness` | Display control service | Sibling of `set_volume`; separate because the platform paths share nothing. |

### Elsewhere — belongs to another repository

These are capabilities the assistant will want, but not ones Host Tools should own. Each is listed with where it goes, so it is not accidentally built here.

| Capability | Belongs to | Reason |
| --- | --- | --- |
| `reminder`, `schedule_task` | Task Core | Work that outlives the process needs a scheduler, not a tool. |
| `lights`, `thermostat`, `door` | Home Bridge | Reasoning over rooms and devices is its own domain. |
| `calendar`, `mail`, `contacts` | Apple Bridge | Acts under the user's identity and carries a vendor SDK. |
| `remember`, `recall` | Memory Core | Memory decides what is worth keeping; a tool would only be a front door to it. |
| `show`, `display` | Display System | Structured visual output is a channel, not a capability. |

## Not included, and why

Four of Mark L's capabilities are deliberately absent. Each is an effect no boundary in this system can contain, and the reasoning lives in [WORKPLAN.md](./WORKPLAN.md) so the absence reads as a decision rather than an oversight.

| Capability | Why not |
| --- | --- |
| `dev_agent`, `desktop_control` | Execute model-generated code. An in-process sandbox around a language runtime is escapable — Mark L's own attempt is defeated by a single `getattr` chain. |
| `computer_control` | Synthesizes keyboard and mouse input into whatever has focus. No declaration can describe what typing does, so no policy can meaningfully decide about it. |
| `send_message` | Acts outward under the user's identity. Belongs behind a confirmation flow owned by whatever holds that identity. |

## Commands

```sh
npm run verify   # typecheck, 33 offline tests, build, catalogue listing
npm run demo     # runs the effect-free capabilities against this machine
```

```sh
host-tools list           # what the catalogue can install
host-tools declarations   # the full schemas a model would see
```

The CLI cannot execute anything. Running a capability requires services and a policy, both of which belong to whatever assembles a runtime — `npm run demo` is a small, readable example of being that assembler.

## Usage

```ts
const registry = new ToolRegistry();

const report = installCatalogue(registry, {
  uptime: nodeUptimeSource(),
  system: nodeSystemProbe(),
  http: new AllowlistHttpBroker({ hosts: ["api.example.com"], request }),
  search: { host: "api.example.com", path: (q, mode) => `/search?q=${encodeURIComponent(q)}&mode=${mode}` },
});

report.installed; // ["get_time", "calculate", "uptime", "system_status", "web_search"]
```

Capabilities that can affect the world install only when their service is supplied. A host with a partial environment gets what it can support and is told precisely what it could not.

Part of [Assistant mark I](../README.md).
