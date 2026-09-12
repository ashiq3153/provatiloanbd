# v1.1 Phase 1 Security Rollout

## Four security areas

### 1. RLS authorization
Target: verified Telegram identity ownership for user rows and server-side/admin-only writes. The current V1.0 public policies are intentionally preserved until all client calls are migrated and regression-tested.

### 2. Admin mutations
Target: Admin Dashboard mutations go through the verified server-side Telegram admin gateway. Direct client-side admin writes must not be treated as an authorization boundary.

### 3. Private documents
Target: document buckets become private and the application uses authenticated/signed access rather than public object URLs. Existing public URLs must be migrated before bucket lockdown.

### 4. Authoritative financial calculations
Target: loan approval/disbursement and financial totals are calculated/committed server-side/database-side. The existing atomic approval function is hardened and duplicate disbursement is constrained.

## Release gate

These controls are not declared production-complete merely by defining target migrations. V1.0 remains untouched until client migration, storage access migration, RLS validation, and regression tests are all verified on the v1.1 branch.
