# ADR-002: Capability Lifecycle

**Status:** Accepted

**Decision Date:** 2026-07-11

## Context

JARVIS capabilities are modular. They may be installed, updated, removed, or temporarily unavailable during runtime.

A consistent lifecycle is required so all components interpret capability state identically.

## Decision

Every capability SHALL follow this lifecycle:

DISCOVERED
    ↓
INSTALLING
    ↓
READY
    ↓
UPDATING
    ↓
READY

Failure at any stage transitions to:

FAILED

Permanent removal transitions to:

REMOVED

## Consequences

- Predictable capability behavior
- Consistent runtime state
- Easier debugging
- Standard lifecycle across all future capability types
