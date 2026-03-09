import "server-only";

import { WordPressConfigError } from "@/lib/wordpress/errors";

const DEFAULT_API_BASE = "https://public-api.wordpress.com/wp/v2/sites";
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_REVALIDATE_SECONDS = 60;

type WordPressMode = "wpcom-private" | "wpcom-public" | "legacy-public";

export type WordPressRuntimeConfig = {
  baseUrl: string;
  accessToken: string | null;
  timeoutMs: number;
  revalidateSeconds: number;
  mode: WordPressMode;
};

let cachedConfig: WordPressRuntimeConfig | null = null;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

function sanitizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function isPlaceholderToken(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("coloque") ||
    normalized.includes("seu_token") ||
    normalized.includes("your_token") ||
    normalized.includes("token_aqui") ||
    normalized === "changeme"
  );
}

export function getWordPressConfig(): WordPressRuntimeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const site = process.env.WORDPRESS_COM_SITE?.trim();
  const rawToken = process.env.WORDPRESS_COM_ACCESS_TOKEN?.trim();
  const token = rawToken && !isPlaceholderToken(rawToken) ? rawToken : null;
  const legacyBaseUrl = process.env.WORDPRESS_API_URL?.trim();
  const apiBase = sanitizeBaseUrl(process.env.WORDPRESS_COM_API_BASE?.trim() || DEFAULT_API_BASE);

  const timeoutMs = parsePositiveInt(process.env.WORDPRESS_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const revalidateSeconds = parsePositiveInt(process.env.WORDPRESS_REVALIDATE_SECONDS, DEFAULT_REVALIDATE_SECONDS);

  if (site) {
    cachedConfig = {
      baseUrl: `${apiBase}/${encodeURIComponent(site)}`,
      accessToken: token,
      timeoutMs,
      revalidateSeconds,
      mode: token ? "wpcom-private" : "wpcom-public",
    };
    return cachedConfig;
  }

  if (legacyBaseUrl) {
    cachedConfig = {
      baseUrl: sanitizeBaseUrl(legacyBaseUrl),
      accessToken: null,
      timeoutMs,
      revalidateSeconds,
      mode: "legacy-public",
    };
    return cachedConfig;
  }

  throw new WordPressConfigError(
    "WordPress CMS is not configured. Set WORDPRESS_COM_SITE + WORDPRESS_COM_ACCESS_TOKEN (private) or WORDPRESS_API_URL (legacy public).",
  );
}
