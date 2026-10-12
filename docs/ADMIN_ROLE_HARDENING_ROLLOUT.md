# Admin role hardening — staged rollout

## What changed
- The admin allowlist still gates entry to the admin gateway.
- Being on `TELEGRAM_ADMIN_CHAT_IDS` no longer automatically grants the `owner` role when the database role lookup returns no row.
- The fallback owner identity is now the separate server-side `TELEGRAM_OWNER_CHAT_ID` value, and that identity must also be in the admin allowlist.
- A database-backed role returned by the existing `get_admin_role` RPC continues to take precedence.
- Unit tests cover allowlist-only access, explicit owner matching, and invalid identities.

## Required before Preview validation
1. In Vercel, add `TELEGRAM_OWNER_CHAT_ID` to **Preview** only, with the existing designated Owner's numeric Telegram chat ID.
2. Confirm that same ID is also present in `TELEGRAM_ADMIN_CHAT_IDS` for Preview.
3. Keep Production unchanged until the Preview build and admin login are verified.
4. Test Owner login and one restricted non-owner account in Preview. Do not add a second account as Owner just to test.
5. Only then consider promoting this change through a reviewed PR.

## Rollback / safety
This branch is not deployed. Do not merge or deploy until Preview has the explicit owner variable; without it, the no-row fallback intentionally grants no owner role. Do not delete or rewrite Supabase data to address the empty `admin_roles` table.
