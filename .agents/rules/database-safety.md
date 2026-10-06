---
name: database-safety
description: Safety constraints for database operations, migrations, and raw SQL queries.
---

# Database Guardrails

- **Parameterization:** Never concatenate or format strings into raw SQL. Use parameterized queries or ORM query builders exclusively.
- **Destructive Statements:** Any script containing `DROP TABLE`, `TRUNCATE`, or irreversible schema drops must halt execution and prompt for explicit user confirmation.
- **Transactions:** Wrap batch updates and multi-table operations in explicit transaction blocks with rollback handling.