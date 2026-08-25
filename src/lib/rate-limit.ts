const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const INITIAL_BLOCK_MS = 15 * 60 * 1000;
const MAX_BLOCK_MS = 24 * 60 * 60 * 1000;

type Entry = {
  count: number;
  firstAt: number;
  lastAt: number;
  blockedUntil: number | null;
  blockCycle: number;
};

const store = new Map<string, Entry>();

function purgeStale(now: number): void {
  for (const [k, e] of store) {
    const idle = now - e.lastAt > WINDOW_MS * 2;
    const blockOver = e.blockedUntil !== null && now >= e.blockedUntil;
    if (idle && (e.blockedUntil === null || blockOver)) {
      store.delete(k);
    }
  }
}

function startCleanupInterval(): void {
  const id = setInterval(() => purgeStale(Date.now()), 60_000);
  if (typeof id === "object" && id !== null && "unref" in id) {
    (id as { unref: () => void }).unref();
  }
}

startCleanupInterval();

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function buildRateLimitKey(ip: string, username: string): string {
  return `${ip}|${username.trim().toLowerCase()}`;
}

export function checkLock(key: string): {
  locked: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const e = store.get(key);
  if (!e || e.blockedUntil === null) {
    return { locked: false, retryAfterSec: 0 };
  }
  if (now < e.blockedUntil) {
    return {
      locked: true,
      retryAfterSec: Math.ceil((e.blockedUntil - now) / 1000),
    };
  }
  e.blockedUntil = null;
  e.count = 0;
  e.firstAt = now;
  return { locked: false, retryAfterSec: 0 };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const e = store.get(key);

  if (!e) {
    store.set(key, {
      count: 1,
      firstAt: now,
      lastAt: now,
      blockedUntil: null,
      blockCycle: 0,
    });
    if (store.size > 10_000) purgeStale(now);
    return;
  }

  if (now - e.firstAt > WINDOW_MS) {
    e.count = 1;
    e.firstAt = now;
    e.lastAt = now;
  } else {
    e.count += 1;
    e.lastAt = now;
  }

  if (e.count >= MAX_ATTEMPTS) {
    e.blockCycle += 1;
    const dur = Math.min(
      INITIAL_BLOCK_MS * Math.pow(2, e.blockCycle - 1),
      MAX_BLOCK_MS
    );
    e.blockedUntil = now + dur;
  }

  if (store.size > 10_000) purgeStale(now);
}

export function clearFailures(key: string): void {
  store.delete(key);
}

export function _resetForTest(): void {
  store.clear();
}

export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS,
  WINDOW_MS,
  INITIAL_BLOCK_MS,
  MAX_BLOCK_MS,
} as const;