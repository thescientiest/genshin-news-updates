---
name: code-style
description: Enforces core coding standards, typing, and architectural boundaries.
---

# Code Standards & Architecture

- **Typing:** Strict type annotations are mandatory for all function signatures and public APIs.
- **Error Handling:** Avoid bare `try/except` or empty `catch` blocks. Always catch specific exceptions and log with structured contextual metadata.
- **Immutability:** Prefer pure functions, immutability, and deterministic returns over side-effect-heavy mutations.
- **Module Boundaries:** Never import internal application modules across bounded contexts; use declared services or client interfaces instead.