-- v1.1 Phase 1 security policy definitions.
-- Intentionally disabled from production rollout until the frontend/server migration is validated.
-- This migration documents the target authorization model without changing live V1.0 behavior.

-- Target model:
-- 1) authenticated users may access only rows belonging to their verified Telegram identity.
-- 2) admin-only mutations are performed through the server-side admin gateway.
-- 3) public users may read published success stories only.
-- 4) system settings are server/admin controlled.
-- 5) transactions and loan status changes are server/atomic-function controlled.

-- No ALTER/DROP POLICY statements are executed here to preserve V1.0 compatibility.
