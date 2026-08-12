# Host Tools v0.1 Workplan

## Goal

Build a catalogue of concrete host capabilities, declared against the Tool System contract, that a model can invoke without any of them reaching the host directly.

## Core principle

A tool declares what it needs and returns a typed outcome. It never imports a process, filesystem, or network primitive; every effect arrives as an injected service, so the capability and the permission to use it stay separate.

## Scope

Declaration and handler factories for a first catalogue of host capabilities: system status, web search, weather, opening a URL, setting output volume, and screen capture. An HTTP broker that is the single network path, mirroring the process broker's argv-only discipline. Correct taint marking on every externally sourced result. Use of the continuation outcome for capabilities that cannot answer within one turn. A registration helper that installs the catalogue into a `ToolRegistry`, and a JSON CLI listing what the catalogue declares.

## Non-goals

The execution pipeline, policy decisions, guards, and brokering (Tool System owns all of these). The model loop (Agent Runtime). Arbitrary code execution, synthetic keyboard or mouse input, message sending, and file writing — see Rejected capabilities. Scheduling that outlives the process (Task Core). Smart-home control (Home Bridge). GUI.

## Boundaries

Host Tools depends on Tool System for contracts and on nothing else. It is consumed by whatever assembles a runtime — in this ecosystem, Assistant Runtime. It never depends on Intelligence Core: a catalogue of capabilities must not know that a model exists, or it stops being usable by anything else.

## Architecture

Each capability exports a declaration factory and a handler factory. The declaration factory takes configuration — a catalogue of permitted URLs, a set of allowed applications — and produces a `ToolDeclaration` whose schema already encodes those limits, so the caller sees what is acceptable before attempting an execution. The handler factory takes the services the capability needs and closes over them. Nothing is read from module scope, from the environment, or from a global, which is what makes every capability testable without a host.

`HttpBroker` is to network access what Tool System's process broker is to process launching: the only path, allowlisted by host, with the response body returned as data. A capability cannot construct its own request.

## Contracts

`installCatalogue(registry, config)` registers every capability. Each capability additionally exports its own `<name>Declaration` and `<name>Handler` so a host can install a subset. `HttpBroker` with `get(host, path, signal)`. `SystemProbe`, `VolumeControl`, and `ScreenCapture` as narrow service interfaces with host-backed and stub implementations.

## Rejected capabilities

Four of Mark L's capabilities are deliberately excluded, because each is an effect no boundary in this system can contain:

`dev_agent` and `desktop_control` execute model-generated code. An in-process sandbox around a language runtime is escapable — Mark L's own attempt is defeated by one `getattr` chain — so the capability cannot be offered honestly until something enforces outside the process.

`computer_control` synthesizes keyboard and mouse input into whatever window has focus. Its effect is unbounded by definition: no declaration can describe what typing does, so no policy can meaningfully decide about it.

`send_message` acts outward under the user's identity. It belongs behind a confirmation flow owned by whatever holds that identity, not behind a tool declaration.

These are recorded rather than silently omitted, so a later reader knows the absence is a decision.

## Security boundaries

No capability imports `child_process`, `fs`, `fetch`, or a platform automation library; services are injected and stubbed in every test. Every result derived from outside the host is marked `external`. The HTTP broker allowlists hosts and returns bodies as data, never as instruction. Declarations encode their limits in the schema so an invalid request is rejected before a handler runs. No capability writes to the filesystem or sends anything outward in v0.1.

## Testing

Tests run offline, without a model, API key, network, hardware, or GUI. Every capability is exercised against stubbed services. Cover: each declaration validating against Tool System, schema rejection of out-of-catalogue values, taint marking on every external result, continuation for screen capture, broker rejection of non-allowlisted hosts, correct outcome variant per capability, and failure paths where a service is absent or errors.

## Milestones

1. Foundation, Tool System dependency, and the service interfaces.
2. `HttpBroker` with host allowlisting and structured rejection.
3. `system_status` — read-only, no broker, proving a capability with no host effect.
4. `web_search` and `weather_report` — network, external taint.
5. `open_url` and `set_volume` — brokered host effects.
6. `screen_capture` — continuation outcome.
7. `installCatalogue`, JSON CLI, documentation, and hardening audit.

## Definition of Done

Every capability registers into a real `ToolRegistry` and executes through a real `ToolRuntime` under stubbed services. Every declaration passes Tool System's validation. Every externally sourced result is marked `external`, asserted by test. No source file imports a process, filesystem, network, or automation primitive, asserted by test. Screen capture returns a continuation rather than blocking a turn. The rejected capabilities are documented with their reasons. Structured errors, automated tests, typecheck, build, documentation, and repository-hygiene audits all pass.

## Stop condition

When the Definition of Done is verified: `Host Tools v0.1 — STATUS: COMPLETE — MODE: MAINTENANCE`. Do not extend into arbitrary code execution, synthetic input, outbound messaging, file writing, scheduling, smart-home control, or a GUI.
