# Project JARVIS

JARVIS is a modular AI operating system scaffold for controlled multi-agent execution, permission-gated tool use, memory, and auditability.

## Project Layout

- `agents/` - architecture documents for persistent agent roles.
- `core/` - architecture documents for the JARVIS core and orchestrator.
- `docs/` - long-form project documentation. `docs/constitution.md` is expected by the runtime when present.
- `runtime/` - executable entry points and runtime-local data.
- `src/agents/` - code adapters for Planner, Security, Engineer, QA, and Memory agents.
- `src/core/` - orchestration and architecture-document loading.
- `src/events/` - runtime event bus primitives.
- `src/runtime/` - runtime bootstrap and dependency wiring.
- `src/memory/` - memory storage interfaces.
- `src/audit/` - audit logging interfaces.
- `src/tools/` - controlled tool registry interfaces.
- `test/` - future automated tests.

## Runtime

Run the placeholder runtime with:

```sh
npm start -- "Describe the request here"
```

The current implementation is intentionally a scaffold. It wires the execution pipeline and module boundaries without implementing production agent reasoning, tool execution, or business logic.

## Runtime Foundation

- `bootJarvisRuntime()` builds the runtime, event bus, service registry, agents, memory store, audit log, and tool registry.
- `runtime.start()` registers core services and lets modules subscribe to the events they own.
- `runtime.handleRequest()` creates a unique execution context for each request and starts the event-driven pipeline.
- `runtime.shutdown()` unsubscribes module handlers and clears registered services.

Every runtime event published through the event bus includes `executionId`, `timestamp`, `source`, and `name`.

## Architecture Rules

- User requests flow through Planner, Security, Engineer, QA, Memory, then final output.
- Agents communicate through the event bus instead of calling each other directly.
- Runtime entry points should stay thin and import modules from `src/`.
- Long-term memory writes should go through the Memory Agent and memory subsystem.
- Tool use should be mediated through the tool registry and security review.
- Architecture documents under `agents/` and `core/` should remain intact.

## Next Development Areas

- Replace placeholder agent adapters with real model/tool integrations.
- Add immutable audit persistence.
- Add test coverage for orchestration flow and security decisions.
- Introduce structured memory backends for episodic, semantic, working, and pin memory.
