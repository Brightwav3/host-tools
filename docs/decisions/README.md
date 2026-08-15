# Host Tools decisions

Architecture Decision Records for choices contained within this repository.

A decision whose reasoning constrains code in another repository does not belong
here — it belongs in [the ecosystem decisions](../../../docs/decisions/README.md)
and, if it can be stated as a rule, in
[`INVARIANTS.md`](../../../INVARIANTS.md).

`ARCHITECTURE.md` describes **how this repository is shaped**. These records
describe **why**. Reasoning added to `ARCHITECTURE.md` instead of here is reasoning
nobody looks for, because an agent asking *why is this like this* opens a decision
record, not a diagram.

## Format

```
NNNN-slug.md          four digits, no gaps, no duplicates
```

Required sections: `Context`, `Decision`, `Rejected alternatives`,
`Consequences`, `Enforced in`, `Explicit non-decisions`.

Every path under `Enforced in` carries a comment at the declaration it constrains,
naming the ADR.

## Index

- [0001 — Every capability is a pair of factories closing over injected services](0001-factories-not-stateful-modules.md)
- [0002 — Installing the catalogue grants nothing by itself](0002-installation-grants-nothing.md)
