# ADR 0002: Installing the catalogue grants nothing by itself, and a partial host still gets what it can support

- **Status:** Accepted
- **Date:** 2026-08-15
- **Decision owners:** M.A.R.K. II architecture
- **Retroactive:** records a decision already implemented in `src/catalogue.ts`

## Context

A catalogue of capabilities has to answer two awkward questions at startup:

1. What happens when the library is imported? If importing registers
   capabilities, then a dependency has granted the host abilities by being
   present. That is the same failure as a policy that permits by omission.
2. What happens when the host can provide some services but not others? A
   development machine has no volume control; a headless host has no screen. If
   installation is all-or-nothing, the host that is missing one service gets
   nothing, and the operator has to guess which one.

## Decision

`installCatalogue(registry, config)` registers **only** capabilities whose services
are present, and **collects** failures rather than throwing.

- Supplying no services registers nothing. Importing the package registers nothing.
- Each capability is registered when its service is configured: `system_status`
  needs `system`, `web_search` needs `http` and `search`, `set_volume` needs
  `volume`, `screen_capture` needs `screen`.
- The return value is `{ installed, failed }` — the names that registered and the
  typed errors for those that did not. A host with a partial environment gets what
  it can support and can report precisely what it could not.
- The trivially cheap capabilities — `get_time`, `calculate` — install unless
  refused with `simple: false`. A catalogue whose useful entries all require setup
  is one nobody turns on.

Registration is not permission. A registered capability is still denied by
`AllowlistPolicy` until explicitly permitted; see
[Tool System ADR 0003](../../../tool-system/docs/decisions/0003-policy-enforcement-point.md).

## Rejected alternatives

### Register everything on import

Rejected. Capability would then follow from a dependency being present, which
means no host could take the library without taking all of it, and the grant would
be invisible at the call site.

### Throw on the first missing service

Rejected. It makes a partial environment indistinguishable from a broken one, and
it hides every subsequent problem behind the first. Collecting failures lets an
operator fix all of them in one pass.

### Silently skip capabilities whose services are absent

Rejected. Skipping without reporting means a capability that quietly did not
install presents as a model that inexplicably will not do something. The `failed`
list turns a mystery into a message.

### Require explicit opt-in for `get_time` and `calculate` as well

Rejected. They need no configuration and have no effect on the world, so requiring
setup for them buys no safety and makes the minimal useful configuration larger
than it needs to be.

## Consequences

### Positive

- Capability is granted by an explicit act, never by an import.
- A partially provisioned host is usable and diagnosable.
- The install report is a precise startup diagnostic, not a log line.

### Costs

- A host must assemble its own services, so there is no one-line "give me
  everything" path — deliberately.
- A missing service presents as an absent capability, which reads as a
  configuration problem only if the caller inspects `failed`.

## Enforced in

- `src/catalogue.ts`

## Explicit non-decisions

This ADR does not decide which capabilities a deployment should install, does not
authorize a default service set, does not govern the policy allowlist, and does not
define behaviour when a service is present but broken at execution time.
