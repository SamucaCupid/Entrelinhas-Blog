import "server-only";

type AttemptState = {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
};

type LimitCheckResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const attemptsByKey = new Map<string, AttemptState>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getConfig() {
  return {
    maxAttempts: parsePositiveInt(process.env.ADMIN_LOGIN_MAX_ATTEMPTS, 5),
    windowSeconds: parsePositiveInt(process.env.ADMIN_LOGIN_WINDOW_SECONDS, 900),
    lockSeconds: parsePositiveInt(process.env.ADMIN_LOGIN_LOCK_SECONDS, 1200),
  };
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function cleanupExpired(currentTime: number, windowSeconds: number): void {
  for (const [key, state] of attemptsByKey) {
    const windowExpired = currentTime - state.firstAttemptAt > windowSeconds;
    const lockExpired = state.lockedUntil > 0 && currentTime >= state.lockedUntil;
    if (windowExpired && lockExpired) {
      attemptsByKey.delete(key);
    }
  }
}

export function checkAdminLoginLimit(key: string): LimitCheckResult {
  const config = getConfig();
  const now = nowSeconds();
  cleanupExpired(now, config.windowSeconds);

  const state = attemptsByKey.get(key);
  if (!state) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (state.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: state.lockedUntil - now,
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function registerAdminLoginFailure(key: string): void {
  const config = getConfig();
  const now = nowSeconds();
  cleanupExpired(now, config.windowSeconds);

  const current = attemptsByKey.get(key);
  if (!current) {
    attemptsByKey.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    });
    return;
  }

  const windowExpired = now - current.firstAttemptAt > config.windowSeconds;
  const attempts = windowExpired ? 1 : current.attempts + 1;
  const firstAttemptAt = windowExpired ? now : current.firstAttemptAt;
  const shouldLock = attempts >= config.maxAttempts;

  attemptsByKey.set(key, {
    attempts,
    firstAttemptAt,
    lockedUntil: shouldLock ? now + config.lockSeconds : 0,
  });
}

export function clearAdminLoginFailures(key: string): void {
  attemptsByKey.delete(key);
}

