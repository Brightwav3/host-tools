# Host Tools — rules for agents

This file is loaded automatically. It carries rules, not description.
`README.md` says what this repository owns. `ARCHITECTURE.md` says how it is
shaped. [`docs/decisions/`](docs/decisions/README.md) says why — read it before
changing a boundary.

`AGENTS.md` is a byte-identical copy of this file. Change both or change neither.

This repository has **no runtime of its own**. It is a library of declarations and
handlers. Tool System validates, gates, guards, and executes.

## Ecosystem invariants that govern this repository

Quoted verbatim from [`INVARIANTS.md`](../INVARIANTS.md), which is the authority.
Do not paraphrase these sentences; a structure test compares them.

**INV-001 — Synchronous capabilities are declared in Host Tools**

> A capability that can produce its answer within the turn that requested it is
> declared in `host-tools` and executed by `tool-system`. It reaches the world
> only through an injected service, never through a direct import of a process,
> filesystem, network, or automation primitive.

This repository is that home. A capability that **cannot** answer within its turn
does not belong here — it goes through the Delegation Broker in
`assistant-runtime/src/delegation/`, which mints an execution identity so a model
holding the turn has no silence to fill with an invented result. See
[ecosystem ADR 0001](../docs/decisions/0001-capability-homes.md).

**INV-003 — Every host effect passes one brokered, deniable place**

> A capability never imports a spawn, filesystem, network, or automation
> primitive. Every effect on the world outside the process arrives through an
> injected service with an allowlist, and no service accepts a composed
> instruction — a shell string, a full URL — where it can accept parts.

## Rules in this repository

1. **Never import `child_process`, `fs`, `fetch`, or an automation library in a
   capability.** Effects arrive as injected services. This rule is checkable by
   reading the import list, and that is the point.
   [ADR 0001](docs/decisions/0001-factories-not-stateful-modules.md)
2. **Two factories per capability** — a declaration factory and a handler factory.
   Nothing reads module scope, the environment, or a global.
3. **Encode configuration into the schema.** Permitted cities become an `enum`, a
   range becomes `minimum`/`maximum`. A caller must be able to see what is
   acceptable without attempting an execution and being refused.
4. **Do not register on import.** `installCatalogue` registers only capabilities
   whose services are present and returns `{ installed, failed }`. Supplying no
   services registers nothing.
   [ADR 0002](docs/decisions/0002-installation-grants-nothing.md)
5. **Collect failures, do not throw.** A host with a partial environment gets what
   it can support and a precise report of what it could not.
6. **Mark taint at the source.** A capability knows whether its content came from
   this host or outside it. `system_status` is `trusted`; `web_search` and
   `weather_report` are `external`. Nothing downstream should have to infer origin
   from a tool name.
7. **Slow but synchronous is a `continuation`**, not a held turn — an
   acknowledgement plus an id, as `screen_capture` does.
8. **Registration is not permission.** A registered capability is still denied by
   the active policy until explicitly allowed.

## Before you finish

- Changed a boundary, chose between two homes for something, or rejected an
  approach a next agent would try? Write an ADR. The six triggers and the
  template are in [../docs/decisions/README.md](../docs/decisions/README.md).
- Edited this file? Copy it to `AGENTS.md` in the same change. They must stay
  byte-identical — Claude Code reads one, Codex reads the other, and a structure
  test compares them.
- Wrote an ADR? Add its identifier as a comment in every file listed under its
  `Enforced in`.
- Reasoning belongs in `docs/decisions/`, not in `ARCHITECTURE.md`.
