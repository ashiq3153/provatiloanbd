import test from "node:test";
import assert from "node:assert/strict";
import {
  assertMemberAccountActive,
  MemberAccountSuspendedError,
} from "../api/member-access.js";

test("allows first-time members without a profile and active members", () => {
  assert.doesNotThrow(() => assertMemberAccountActive(null));
  assert.doesNotThrow(() => assertMemberAccountActive({ is_banned: false, is_locked: false }));
  assert.doesNotThrow(() => assertMemberAccountActive({ is_banned: false, is_locked: null }));
});

test("blocks locked and banned members with a stable error code", () => {
  for (const profile of [
    { is_locked: true, is_banned: false },
    { is_locked: false, is_banned: true },
  ]) {
    assert.throws(
      () => assertMemberAccountActive(profile),
      error => error instanceof MemberAccountSuspendedError && error.code === "ACCOUNT_SUSPENDED",
    );
  }
});
