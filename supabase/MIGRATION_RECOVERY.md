# Supabase Migration Source Recovery

**Purpose:** Restore the exact SQL stored for already-applied Supabase migrations into version-controlled files. This is source recovery only; it does not apply SQL or mutate Supabase.

## Source of truth used
The connected project returned 28 rows from `supabase_migrations.schema_migrations`. Each row includes the migration version, name and stored `statements[1]`. The 28 new `supabase/migrations/<version>_<name>.sql` files contain those statements. This does not mean the statements should be run again.

## Recovered applied migrations

| Version | Name |
|---|---|
| `20260616141533` | `add_success_stories_rls_policies` |
| `20260910184646` | `phase1_security_integrity_retry` |
| `20260910184722` | `phase1_harden_public_definer` |
| `20260910193712` | `v1_1_phase1_integrity_constraints_v2` |
| `20260911110905` | `v1_1_phase1_restore_compatible_status_constraints` |
| `20260911211341` | `v1_1_phase1_telegram_identity_bridge` |
| `20260912070826` | `harden_loan_approval_search_path` |
| `20260912101158` | `v11_identity_rls_storage_lockdown` |
| `20260912101952` | `revoke_anon_identity_function_execute` |
| `20260913125351` | `phase1_protect_admin_only_columns` |
| `20260913135335` | `fix_mutable_search_path_trigger_functions` |
| `20260913135343` | `lock_down_admin_status_table` |
| `20260913141755` | `prevent_duplicate_trx_id` |
| `20260920085322` | `phase1_allow_revision_and_workflow_statuses` |
| `20260920111644` | `v11_phase1_professional_audit_foundation` |
| `20260920113253` | `v11_phase1_audit_status_triggers` |
| `20260920113745` | `v11_phase1_admin_roles_foundation` |
| `20260920113847` | `v11_phase1_admin_role_lookup` |
| `20260920114847` | `v11_phase1_financial_rate_versions` |
| `20260920115151` | `v11_phase1_financial_ledger_verification` |
| `20260920115413` | `v11_phase1_backfill_completed_transaction_ledger` |
| `20260920115451` | `v11_phase1_emi_schedule_foundation` |
| `20260920115752` | `v11_phase1_apply_emi_payment_schedule` |
| `20260920115806` | `v11_phase1_finalize_transaction_hook` |
| `20260920115829` | `v11_phase1_emi_overdue_function` |
| `20260920120212` | `v11_phase1_notifications_kyc_foundation` |
| `20260920120421` | `v11_phase1_financial_reconciliation_summary` |
| `20260920190203` | `remove_support_chat_add_contact_channels` |

## Four legacy files moved out of the active migration directory

These files were present on `v1.1-phase1` but did not match an applied migration version/name row, so they were moved to `supabase/proposals/untracked/` for preservation rather than leaving them as apparently pending migrations:

- `20260911_phase1_security.sql` — combined SQL that overlaps earlier applied work but is not an exact applied migration source.
- `20260912090000_v11_security_policies.sql` — explanatory/target-policy notes with no executable policy changes.
- `20260919125000_phase1_authoritative_dashboard_stats.sql` — contains `public.get_dashboard_stats(bigint)`. The function exists in the live DB, its definition matches the stored proposal, and the DB ACL allows `authenticated` and `service_role` but not `anon`. However, no applied migration-history statement mentions that function. This is an **untracked live object** that needs a documented migration-history repair/baseline decision; do not blindly run it.
- `20260920150000_phase1_allow_revision_and_workflow_statuses.sql` — the same logical status constraint change is recorded as applied under `20260920085322`, not this filename/version.

## Do not deploy yet

1. Review the recovered SQL against the current live schema, policies, grants, triggers and function definitions.
2. Resolve the `get_dashboard_stats` live-object/history discrepancy with the Supabase CLI on a working copy; use a deliberate migration repair or safe new migration only after review.
3. Validate a local/non-production environment against this recovered sequence.
4. Only then stage the new applicant draft/document tables and the core table-write restrictions (issues #21, #5 and PRs #14/#23).

**No SQL was run from this recovery operation, and no live database schema/data/history was changed.** This branch is not permission to run `supabase db push` until the reconciliation is reviewed.