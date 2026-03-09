type IpAllowConfig = {
  enabled: boolean;
  allowedIps: string[];
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") {
    return true;
  }

  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
    return false;
  }

  return fallback;
}

function normalizeIp(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice("::ffff:".length);
  }

  return trimmed;
}

function parseAllowedIps(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => normalizeIp(item))
    .filter(Boolean);
}

function readConfig(): IpAllowConfig {
  return {
    enabled: parseBoolean(process.env.ADMIN_IP_ALLOWLIST_ENABLED, false),
    allowedIps: parseAllowedIps(process.env.ADMIN_ALLOWED_IPS),
  };
}

function toIpv4Int(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const numbers: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }

    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) {
      return null;
    }

    numbers.push(n);
  }

  return ((numbers[0] << 24) | (numbers[1] << 16) | (numbers[2] << 8) | numbers[3]) >>> 0;
}

function matchesIpv4Cidr(ip: string, cidr: string): boolean {
  const [rangeIp, rangeBitsRaw] = cidr.split("/");
  if (!rangeIp || !rangeBitsRaw) {
    return false;
  }

  const bits = Number(rangeBitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) {
    return false;
  }

  const ipInt = toIpv4Int(ip);
  const rangeInt = toIpv4Int(rangeIp);
  if (ipInt === null || rangeInt === null) {
    return false;
  }

  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function matchesRule(ip: string, rule: string): boolean {
  if (!rule) {
    return false;
  }

  if (rule.includes("/")) {
    return matchesIpv4Cidr(ip, rule);
  }

  return ip === rule;
}

export function getClientIpFromHeaderValues(values: { xForwardedFor?: string | null; xRealIp?: string | null; fallbackIp?: string | null }): string {
  const forwarded = values.xForwardedFor?.split(",")[0]?.trim();
  if (forwarded) {
    return normalizeIp(forwarded);
  }

  const realIp = values.xRealIp?.trim();
  if (realIp) {
    return normalizeIp(realIp);
  }

  return normalizeIp(values.fallbackIp?.trim() || "");
}

export function isIpAllowedForAdmin(clientIpRaw: string): boolean {
  const config = readConfig();
  if (!config.enabled) {
    return true;
  }

  const clientIp = normalizeIp(clientIpRaw);
  if (!clientIp) {
    return false;
  }

  if (!config.allowedIps.length) {
    return false;
  }

  return config.allowedIps.some((rule) => matchesRule(clientIp, rule));
}

