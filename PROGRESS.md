# Progress

## Current state

COMPLETE — Host Tools v0.1 is in MAINTENANCE mode.

## Completed

- Service interfaces: `HttpBroker`, `SystemProbe`, `VolumeControl`, `ScreenCapture`, with an allowlisting HTTP broker.
- Nine capabilities: `get_time`, `calculate`, `uptime`, `system_status`, `web_search`, `weather_report`, `open_url`, `set_volume`, `screen_capture`.
- Node-backed service implementations in `src/hosts/`, the only directory permitted to import a platform module.
- `installCatalogue` with partial-environment support and collected failures.
- JSON CLI (`list`, `declarations`) with no execution path, and a demo script that assembles a real runtime for the effect-free capabilities.
- Rejected capabilities documented with reasons in WORKPLAN and README.

## Verification

- `npm run verify` — typecheck, 33 offline tests, build, compiled CLI listing. All pass.
- `npm run demo` — the effect-free capabilities executed against this machine, including a rejected `eval` operator and a division by zero.
- Every declaration validated against Tool System's own `validateDeclaration`.
- Every capability executed through a real `ToolRuntime` under stubbed services.
- Import audit is a test: no file outside `src/hosts/` imports any `node:*` module or an automation library, and none calls `fetch` directly.
- Taint asserted per capability: host telemetry `trusted`, network results `external`.

## Next milestone

Maintenance only: bugs, security fixes, compatibility, or required contract evolution.

## Known limitations

- Search and weather take an injected path builder rather than integrating a specific provider; choosing one is a host decision.
- `screen_capture` returns a continuation but does not deliver the image. Delivery is the consumer's channel; this repository correlates by id only.
- No capability writes to the filesystem, sends anything outward, or persists beyond the process, by design.
- Node-backed implementations exist for `SystemProbe` and `UptimeSource` only. `VolumeControl` and `ScreenCapture` remain interfaces; a host supplies them.

## Planned

The catalogue's intended growth, and the capabilities that belong to other repositories rather than this one, are listed in README.md.
