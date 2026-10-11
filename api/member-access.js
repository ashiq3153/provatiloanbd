export class MemberAccountSuspendedError extends Error {
  constructor() {
    super("This account is locked or suspended. Contact Support for assistance.");
    this.name = "MemberAccountSuspendedError";
    this.code = "ACCOUNT_SUSPENDED";
  }
}

export function assertMemberAccountActive(profile) {
  if (profile?.is_banned === true || profile?.is_locked === true) {
    throw new MemberAccountSuspendedError();
  }
}
