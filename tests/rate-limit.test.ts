import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRateLimitKey,
  checkLock,
  clearFailures,
  getClientIp,
  RATE_LIMIT_CONFIG,
  recordFailure,
  _resetForTest,
} from "@/lib/rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  _resetForTest();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getClientIp", () => {
  it("lee el primer segmento de x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });

  it("cae a x-real-ip si no hay x-forwarded-for", () => {
    const h = new Headers({ "x-real-ip": "5.6.7.8" });
    expect(getClientIp(h)).toBe("5.6.7.8");
  });

  it("devuelve 'unknown' si no hay cabeceras", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("buildRateLimitKey", () => {
  it("combina IP y username normalizado", () => {
    expect(buildRateLimitKey("1.2.3.4", "Admin")).toBe("1.2.3.4|admin");
    expect(buildRateLimitKey("1.2.3.4", "  admin  ")).toBe("1.2.3.4|admin");
  });
});

describe("recordFailure + checkLock", () => {
  it("permite hasta N-1 intentos sin bloquear", () => {
    const key = "1.2.3.4|alice";
    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1; i++) {
      recordFailure(key);
      expect(checkLock(key).locked).toBe(false);
    }
  });

  it("bloquea al alcanzar N intentos", () => {
    const key = "1.2.3.4|bob";
    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
      recordFailure(key);
    }
    const lock = checkLock(key);
    expect(lock.locked).toBe(true);
    expect(lock.retryAfterSec).toBeGreaterThan(0);
    expect(lock.retryAfterSec).toBeLessThanOrEqual(
      Math.ceil(RATE_LIMIT_CONFIG.INITIAL_BLOCK_MS / 1000)
    );
  });

  it("el bloqueo expira tras el TTL", () => {
    const key = "1.2.3.4|carol";
    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
      recordFailure(key);
    }
    expect(checkLock(key).locked).toBe(true);

    vi.advanceTimersByTime(RATE_LIMIT_CONFIG.INITIAL_BLOCK_MS + 1000);

    expect(checkLock(key).locked).toBe(false);
  });

  it("el segundo ciclo de bloqueo es más largo (backoff progresivo)", () => {
    const key = "1.2.3.4|dave";

    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
      recordFailure(key);
    }
    const firstBlockSec = checkLock(key).retryAfterSec;
    expect(firstBlockSec).toBeGreaterThan(0);

    vi.advanceTimersByTime(RATE_LIMIT_CONFIG.INITIAL_BLOCK_MS + 1000);

    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
      recordFailure(key);
    }
    const secondBlockSec = checkLock(key).retryAfterSec;

    expect(secondBlockSec).toBeGreaterThan(firstBlockSec);
  });

  it("el backoff se duplica pero nunca supera MAX_BLOCK_MS", () => {
    const key = "1.2.3.4|eve";
    let prev = 0;
    for (let cycle = 0; cycle < 12; cycle++) {
      vi.advanceTimersByTime(
        Math.max(RATE_LIMIT_CONFIG.INITIAL_BLOCK_MS, prev) + 1000
      );
      for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
        recordFailure(key);
      }
      const sec = checkLock(key).retryAfterSec;
      expect(sec).toBeLessThanOrEqual(
        Math.ceil(RATE_LIMIT_CONFIG.MAX_BLOCK_MS / 1000)
      );
      prev = sec;
    }
  });

  it("clearFailures resetea el contador y desbloquea", () => {
    const key = "1.2.3.4|frank";
    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
      recordFailure(key);
    }
    expect(checkLock(key).locked).toBe(true);

    clearFailures(key);

    expect(checkLock(key).locked).toBe(false);

    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS - 1; i++) {
      recordFailure(key);
      expect(checkLock(key).locked).toBe(false);
    }
  });

  it("el contador se reinicia si la primera entrada es más antigua que", () => {
    const key = "1.2.3.4|grace";
    recordFailure(key);
    recordFailure(key);

    vi.advanceTimersByTime(RATE_LIMIT_CONFIG.WINDOW_MS + 1000);

    recordFailure(key);

    expect(checkLock(key).locked).toBe(false);
  });

  it("las claves de distintos usuarios no se interfieren", () => {
    const keyA = "1.2.3.4|alice";
    const keyB = "1.2.3.4|bob";

    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
      recordFailure(keyA);
    }
    expect(checkLock(keyA).locked).toBe(true);
    expect(checkLock(keyB).locked).toBe(false);
  });

  it("las claves de distintas IPs no se interfieren", () => {
    const keyA = "1.2.3.4|alice";
    const keyB = "5.6.7.8|alice";

    for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_ATTEMPTS; i++) {
      recordFailure(keyA);
    }
    expect(checkLock(keyA).locked).toBe(true);
    expect(checkLock(keyB).locked).toBe(false);
  });
});