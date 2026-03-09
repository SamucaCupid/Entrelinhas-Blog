import "server-only";

import type { PostUI } from "@/types";

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_SITE_NAME = "Entrelinhas";
const DEFAULT_SITE_DESCRIPTION = "Portal de noticias de Vitoria da Conquista e regiao";

function sanitizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;

  try {
    const parsed = new URL(candidate);
    return sanitizeBaseUrl(parsed.toString());
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteName(): string {
  return DEFAULT_SITE_NAME;
}

export function getSiteDescription(): string {
  return DEFAULT_SITE_DESCRIPTION;
}

export function toMetaDescription(value: string, fallback = DEFAULT_SITE_DESCRIPTION): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
}

export function postDescription(post: PostUI): string {
  return toMetaDescription(post.excerpt || post.title);
}

