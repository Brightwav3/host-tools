# Known Issues

- A missing service presents as an absent capability. `installCatalogue` returns
  `{ installed, failed }`, but a host that does not inspect `failed` sees only a
  model that inexplicably will not do something. See
  [ADR 0002](docs/decisions/0002-installation-grants-nothing.md).

- Taint classification is the capability author's claim. The runtime cannot verify
  that `system_status` is really `trusted` or that a new network capability marked
  itself `external`.

- Host Tools cannot serve capabilities requiring session-scoped runtime state,
  because every service is a pure injected effect. Such capabilities go through the
  Delegation Broker — see
  [ecosystem ADR 0001](../docs/decisions/0001-capability-homes.md).

- `screen_capture` returns a `continuation`; delivery of the actual image is the
  consumer's responsibility on its own channel. A consumer that ignores
  continuations silently loses the result.
