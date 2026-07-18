import "server-only";
import type { NextRequest } from "next/server";

/**
 * Brute-force controls for the login endpoint. Two independent layers, because
 * neither is sufficient alone:
 *
 *  - Per-account lockout, held in MongoDB. Survives restarts and is shared
 *    across instances, so an attacker rotating source IPs still can't grind a
 *    single account. This is the primary control.
 *  - Per-IP throttle, held in memory. Catches spraying across many accounts
 *    (which the per-account counter never sees) but is best-effort only:
 *    it resets on deploy and is per-instance.
 */

export const MAX_ACCOUNT_ATTEMPTS = 10;
export const LOCKOUT_MS = 15 * 60 * 1000;
/** Failures older than this are stale — a typo last week shouldn't count. */
export const ATTEMPT_DECAY_MS = 60 * 60 * 1000;

const MAX_IP_ATTEMPTS = 20;
const IP_WINDOW_MS = 10 * 60 * 1000;

const ipAttempts = new Map<string, { count: number; resetAt: number }>();

/**
 * `x-forwarded-for` is attacker-controlled unless a proxy we trust overwrote
 * it, so a spoofed header would hand out a fresh bucket on every request. Only
 * honour it when TRUSTED_PROXY is set (Vercel and any reverse proxy that
 * rewrites the header); otherwise fall back to a single shared bucket, which
 * throttles conservatively rather than not at all.
 */
export function clientIp(request: NextRequest): string {
  if (process.env.TRUSTED_PROXY !== "1") return "untrusted";
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function ipThrottled(ip: string): boolean {
  const now = Date.now();
  // Opportunistic sweep — this map must not grow without bound.
  if (ipAttempts.size > 5000) {
    for (const [key, entry] of ipAttempts) if (now > entry.resetAt) ipAttempts.delete(key);
  }
  const entry = ipAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_IP_ATTEMPTS;
}

export function clearIpAttempts(ip: string): void {
  ipAttempts.delete(ip);
}

export interface LockState {
  failedLoginAttempts?: number;
  lastFailedLoginAt?: Date | null;
  lockedUntil?: Date | null;
}

/** Seconds remaining on an active lock, or 0 when the account is not locked. */
export function lockSecondsRemaining(account: LockState, now = Date.now()): number {
  const until = account.lockedUntil ? new Date(account.lockedUntil).getTime() : 0;
  return until > now ? Math.ceil((until - now) / 1000) : 0;
}

/**
 * Computes the account's counters after a failed attempt. Returns the fields to
 * persist so the caller decides how to write them.
 */
export function registerFailure(account: LockState, now = Date.now()): Required<LockState> {
  const last = account.lastFailedLoginAt ? new Date(account.lastFailedLoginAt).getTime() : 0;
  const decayed = now - last > ATTEMPT_DECAY_MS;
  const attempts = (decayed ? 0 : (account.failedLoginAttempts ?? 0)) + 1;
  return {
    failedLoginAttempts: attempts,
    lastFailedLoginAt: new Date(now),
    lockedUntil: attempts >= MAX_ACCOUNT_ATTEMPTS ? new Date(now + LOCKOUT_MS) : null,
  };
}

export const CLEARED_LOCK: Required<LockState> = {
  failedLoginAttempts: 0,
  lastFailedLoginAt: null,
  lockedUntil: null,
};
