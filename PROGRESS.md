# Progress

## Current state

COMPLETE — Host Tools v0.1 is in MAINTENANCE mode.

## Completed

- Service interfaces: `HttpBroker`, `SystemProbe`, `VolumeControl`, `ScreenCapture`, with an allowlisting HTTP broker.
- Six capabilities: `system_status`, `web_search`, `weather_report`, `open_url`, `set_volume`, `screen_capture`.
- `installCatalogue` with partial-environment support and collected failures.
- JSON CLI (`list`, `declarations`) with no execution path.
- Rejected capabilities documented with reasons in WORKPLAN and README.

## Verification

- `npm run verify` — typecheck, 20 offline tests, build, compiled CLI listing. All pass.
- Every declaration validated against Tool System's own `validateDeclaration`.
- Every capability executed through a real `ToolRuntime` under stubbed services.
- Import audit is a test: no source file imports `child_process`, `fs`, `node:https`, `node:net`, `axios`, `puppeteer`, or `robotjs`, and none calls `fetch` directly.
- Taint asserted per capability: host telemetry `trusted`, network results `external`.

## Next milestone

Maintenance only: bugs, security fixes, compatibility, or required contract evolution.

## Known limitations

- Search and weather take an injected path builder rather than integrating a specific provider; choosing one is a host decision.
- `screen_capture` returns a continuation but does not deliver the image. Delivery is the consumer's channel; this repository correlates by id only.
- No capability writes to the filesystem, sends anything outward, or persists beyond the process, by design.
- Host-backed implementations of `SystemProbe`, `VolumeControl`, and `ScreenCapture` are not included; only the interfaces and stubs are. A host supplies real ones.

## Not yet decided

The repository is not a git repository and is not registered as a submodule of the meta-repository.
