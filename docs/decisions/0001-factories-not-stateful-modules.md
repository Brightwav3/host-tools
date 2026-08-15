# ADR 0001: Every capability is a pair of factories closing over injected services

- **Status:** Accepted
- **Date:** 2026-08-15
- **Decision owners:** M.A.R.K. II architecture
- **Retroactive:** records a decision already implemented across `src/tools/`

## Context

A capability needs two things that usually get taken from module scope: its
configuration (which cities are permitted, what the volume range is, which search
endpoint) and its effects (network, process launch, screen capture).

Reading either from module scope, the environment, or a global produces a
capability that cannot be constructed twice with different settings, cannot be
tested without arranging the ambient world, and whose real dependencies are
invisible to anyone reading its signature.

There is a second, less obvious cost. If configuration is read at execution time,
a caller cannot discover what is acceptable until it attempts something and is
refused.

## Decision

Each capability exports a **declaration factory** and a **handler factory**.

The declaration factory takes configuration and **encodes it into the schema**:
permitted cities become a parameter `enum`, a volume range becomes `minimum` and
`maximum`, a known application set becomes the catalog's keys. A caller can see
what is acceptable before attempting an execution rather than learning it from a
rejection.

The handler factory takes the services it needs and closes over them. Nothing
reads module scope, the environment, or a global. That is what makes every
capability testable without a host, and what makes the "no direct host access"
rule checkable by reading imports instead of tracing calls.

Services are the narrow interfaces in `src/services.ts`: `HttpBroker`,
`SystemProbe`, `VolumeControl`, `ScreenCapture`, plus `ProcessBroker` from Tool
System. Each is one method wide, and none accepts a composed instruction where it
can accept parts — `HttpBroker.get(host, path, signal)` takes pieces and composes
the URL itself, mirroring the process broker's refusal of shell strings.

## Rejected alternatives

### Read configuration from environment variables inside the handler

Rejected. It makes the capability's contract depend on ambient state, makes two
differently-configured instances impossible in one process, and hides the
configuration from the declaration a model reads.

### Export a class per capability, configured in its constructor

Rejected as heavier than the problem. A class gives each capability a place to
accumulate state, and state in a capability is what makes concurrent execution
unsafe. Two factories and a closure express the same binding without offering the
extra room.

### Validate configuration at execution time rather than encoding it in the schema

Rejected. It moves discoverable constraints into rejections, so a model learns the
permitted set by guessing at it. An enum in the declaration is the same
information delivered before the attempt instead of after.

### Let capabilities import `fetch`, `child_process`, or an automation library

Rejected. The effect then passes through nothing that can observe, deny, trace, or
stub it, and the absence of such imports is the property that makes this catalogue
auditable by reading its import list.

## Consequences

### Positive

- Every capability is testable with plain stubs and no host.
- Configuration is visible to the caller as schema, not discovered by rejection.
- The security rule is verifiable by reading imports rather than tracing calls.

### Costs

- Two exports per capability instead of one, and a host must wire both.
- A capability needing an effect with no service interface cannot be written until
  the interface exists. That is intended, and it is why session-scoped stateful
  capabilities live in the delegation path — see
  [ecosystem ADR 0001](../../../docs/decisions/0001-capability-homes.md).

## Enforced in

- `src/services.ts`
- `src/tools/host-control.ts`
- `src/tools/web-search.ts`
- `src/tools/system-status.ts`
- `src/tools/screen-capture.ts`
- `src/tools/simple.ts`

## Explicit non-decisions

This ADR does not decide which services a host must provide, does not authorize a
filesystem service, does not govern how `hosts/node.ts` implements a probe beyond
keeping it behind the interface, and does not fix the taint classification of any
capability — that is [Tool System ADR 0004](../../../tool-system/docs/decisions/0004-outcomes-are-a-union.md).
