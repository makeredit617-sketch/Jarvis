# ADR-001: Runtime Event Contract

**Status:** Accepted

**Decision Date:** 2026-07-11

**Phase:** 4.3

## Context

JARVIS is an event-driven system. Every agent communicates through the Event Bus.

Without a common event structure, agents would have incompatible interfaces and debugging would become difficult as the system grows.

## Decision

Every runtime event SHALL use the following structure:

```javascript
{
  name: "ExecutionFailed",
  executionId: "exec-123",
  source: "engineer",
  timestamp: "2026-07-11T12:34:56Z",

  payload: {},

  metadata: {}
}

python3 << 'EOF'
from pathlib import Path

Path("some/file").write_text("""...""")

print("✅ Surgery completed.")
