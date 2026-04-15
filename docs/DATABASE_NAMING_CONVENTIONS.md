# Database Naming Conventions

## Document Purpose
This document standardizes naming for database objects in PSBUniverse Core.

Goals:
1. Make schema readable and predictable
2. Reduce onboarding friction
3. Improve query consistency and migration safety
4. Support long-term governance

## Naming Philosophy
Use names that communicate:
1. Domain
2. Object type
3. Relationship intent
4. Lifecycle status

A developer should understand a table role without opening its entire DDL.

## 1) Table Naming Rules

### Prefix model

| Prefix | Meaning | Example |
|---|---|---|
| psb_s_ | Source/master/reference table | psb_s_user, psb_s_role, psb_s_application |
| psb_m_ | Mapping/link table | psb_m_userapproleaccess, psb_m_appcardroleaccess |
| psb_t_ | Transaction/event table (future use) | psb_t_invoice, psb_t_auditlog |

### Rules
1. Always include platform prefix psb_.
2. Use lowercase snake_case only.
3. Use singular nouns for entity tables when practical.
4. Use explicit relationship names for mapping tables.

### Good vs bad examples

| Good | Bad | Why |
|---|---|---|
| psb_s_user | users | Missing platform and table class context |
| psb_m_userapproleaccess | user_role_map | Too generic and inconsistent |
| psb_s_appcard | cards_tbl | Ambiguous and non-standard suffix |

## 2) Column Naming Conventions

### Primary keys
1. Use <entity>_id.
2. Type should match relationship strategy (bigint in current schema).

Examples:
1. user_id
2. role_id
3. app_id
4. card_id

### Foreign keys
1. Reuse referenced PK name exactly.
2. Avoid alternate names like user_ref_id unless required for special context.

Good:
1. user_id -> references psb_s_user.user_id
2. app_id -> references psb_s_application.app_id

Bad:
1. usr_id
2. app_ref

### Boolean columns
1. Prefix with is_ for state flags.
2. Use positive semantics.

Examples:
1. is_active
2. is_deleted (if soft delete is implemented)

### Timestamp columns
Use consistent audit fields:
1. created_at
2. updated_at
3. created_by
4. updated_by

### Identity bridge column
Use explicit bridge naming for auth identity mapping:
1. auth_user_id (UUID)

## 3) Constraint Naming Conventions

### Primary key
Pattern:
1. <table_name>_pkey

Example:
1. psb_s_user_pkey

### Foreign key
Pattern:
1. fk_<child_context>_<parent_context>

Examples:
1. fk_user_company
2. fk_card_group
3. fk_group_app

### Unique constraint
Pattern:
1. <table_name>_<column_or_purpose>_key
or
2. uq_<purpose>

Examples:
1. psb_s_user_email_key
2. uq_card_role

### Check constraint
Pattern:
1. <table_name>_<rule_name>_ck

Example:
1. psb_s_application_display_order_positive_ck

## 4) Index Naming Conventions

### Non-unique index
Pattern:
1. idx_<table>_<column_or_columns>

Examples:
1. idx_user_email
2. idx_user_company

### Unique index
Pattern:
1. <table>_<column>_uq
or
2. uq_<purpose>

Example:
1. psb_s_application_display_order_uq

## 5) Naming Rules for Mapping Tables

Mapping tables should express relationship intent.

Example:
1. psb_m_userapproleaccess
   - maps user to role to application
2. psb_m_appcardroleaccess
   - maps card to role

Do not use vague names like map1, relation, or link_table.

## 6) Recommended Data-Type Consistency

| Column Category | Recommendation |
|---|---|
| PK/FK in business tables | bigint (as current schema) |
| Auth identity bridge | uuid (auth_user_id) |
| Timestamps | timestamp with time zone |
| Flags | boolean |

## 7) SQL Examples

### Example: compliant table

```sql
create table public.psb_s_featureflag (
   flag_id bigserial primary key,
   app_id bigint not null,
   flag_name text not null,
   is_active boolean default true,
   created_at timestamp with time zone default now(),
   updated_at timestamp with time zone,
   constraint fk_featureflag_app
      foreign key (app_id) references psb_s_application(app_id)
);
```

### Example: compliant index

```sql
create index if not exists idx_featureflag_app
on public.psb_s_featureflag(app_id);
```

## 8) Anti-Patterns to Avoid

1. Mixed casing (UserTable, RoleMap).
2. Abbreviations with unclear meaning (usr, rl, applnk).
3. Prefix-free tables in a prefixed schema.
4. Different names for the same FK concept in different tables.
5. Weak constraint naming that hides relationship intent.

## 9) Governance Checklist for New Tables

Before merging a schema change, verify:

1. Table uses correct prefix and snake_case.
2. PK and FK names follow entity_id pattern.
3. Audit columns are consistent.
4. Constraints follow naming patterns.
5. Index names are explicit and searchable.
6. Mapping tables clearly describe their relationship purpose.

Following these rules keeps PSBUniverse Core schema maintainable, reviewable, and scalable.