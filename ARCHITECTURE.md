# Architecture

Host Tools is a library of declarations and handlers. It has no runtime of its own: Tool System validates, gates, guards, and executes; this repository only describes what can be done and how.

```text
installCatalogue(registry, services)
        |
        v
ToolRegistry  ->  ToolRuntime  ->  handler
                                      |
                          injected services only
                          (HttpBroker, SystemProbe,
                           VolumeControl, ScreenCapture,
                           ProcessBroker from Tool System)
```

## Factories, not modules with state

Each capability exports a declaration factory and a handler factory. The declaration factory takes configuration and encodes it into the schema — permitted cities become an enum, a volume range becomes bounds — so a caller can see what is acceptable before attempting an execution rather than learning it from a rejection.

The handler factory takes the services it needs and closes over them. Nothing reads module scope, the environment, or a global. That is what makes every capability testable without a host, and what makes the "no direct host access" rule checkable by reading imports instead of tracing calls.

## The network broker mirrors the process broker

`HttpBroker.get(host, path, signal)` takes parts, never a composed URL, and allowlists the host. A capability cannot redirect itself somewhere the allowlist does not cover, in the same way a process cannot be launched through a shell string. Both brokers exist so there is exactly one observable, deniable place per effect class.

## Taint is decided at the source

A capability knows whether its content came from this host or from outside it, so it marks the result. `system_status` is `trusted`; `web_search` and `weather_report` are `external`. Nothing downstream has to infer origin from a tool name, and nothing upstream has to remember to ask.

## Continuation instead of dead air

`screen_capture` starts the work and returns a `continuation` with an acknowledgement and an id. The alternative — holding the turn for several seconds — is what makes an assistant feel broken. Because the outcome variant is declared, every slow capability gets the same treatment without inventing its own stalling convention.

## Installation grants nothing by itself

`installCatalogue` registers only capabilities whose services are present, and collects failures rather than throwing, so a host with a partial environment gets what it can support and can report precisely what it could not. Supplying no services registers nothing.
