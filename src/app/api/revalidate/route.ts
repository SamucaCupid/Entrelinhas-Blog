import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RevalidatePayload = {
  secret?: string;
  slug?: string;
  categorySlug?: string;
  categorySlugs?: string[];
  paths?: string[];
  revalidateAll?: boolean;
  post_name?: string;
  post_category?: string | string[];
  categories?: string | string[];
  permalink?: string;
  post_url?: string;
  post?: {
    post_name?: string;
    post_category?: string | string[];
    categories?: string | string[];
    permalink?: string;
    post_url?: string;
  };
};

const DEFAULT_CATEGORY_PATHS = [
  "/categoria/politica",
  "/categoria/policia",
  "/categoria/eventos",
  "/categoria/negocios",
  "/categoria/cultura",
];

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function sanitizePath(value: string): string | null {
  const normalized = value.trim();
  if (!normalized.startsWith("/")) {
    return null;
  }

  if (normalized.startsWith("//")) {
    return null;
  }

  if (normalized.includes("..")) {
    return null;
  }

  return normalized;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toStringList(item));
  }

  if (typeof value === "number") {
    return [String(value)];
  }

  if (typeof value !== "string") {
    return [];
  }

  const raw = value.trim();
  if (!raw) {
    return [];
  }

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      return toStringList(JSON.parse(raw));
    } catch {
      // no-op: fallback to string split below
    }
  }

  return raw
    .split(/[,\n;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function readFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function getSlugFromUrl(rawUrl: string): string {
  if (!rawUrl) {
    return "";
  }

  try {
    const parsed = new URL(rawUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length ? normalizeSlug(segments[segments.length - 1]) : "";
  } catch {
    return "";
  }
}

function safeCompareSecret(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

function detectTriggerSource(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";

  if (userAgent.includes("wordpress")) {
    return "wordpress";
  }

  if (userAgent.includes("curl")) {
    return "curl";
  }

  if (userAgent.includes("powershell")) {
    return "powershell";
  }

  return "manual-or-automation";
}

async function parsePayload(request: NextRequest): Promise<RevalidatePayload> {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";

  if (contentType.includes("application/json")) {
    const json = await request.json();
    return getObject(json) ? (json as RevalidatePayload) : {};
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: Record<string, unknown> = {};

    for (const [key, entry] of formData.entries()) {
      const value = typeof entry === "string" ? entry : entry.name;
      const current = payload[key];

      if (current === undefined) {
        payload[key] = value;
      } else if (Array.isArray(current)) {
        current.push(value);
      } else {
        payload[key] = [current, value];
      }
    }

    return payload as RevalidatePayload;
  }

  return {};
}

export async function POST(request: NextRequest) {
  const source = detectTriggerSource(request);
  const configuredSecret = process.env.REVALIDATE_WEBHOOK_SECRET?.trim();
  if (!configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "REVALIDATE_WEBHOOK_SECRET nao configurado no servidor.",
      },
      { status: 500 },
    );
  }

  let payload: RevalidatePayload = {};
  try {
    payload = await parsePayload(request);
  } catch {
    console.warn("[revalidate] invalid payload", { source });
    return NextResponse.json(
      {
        ok: false,
        error: "Payload invalido.",
      },
      { status: 400 },
    );
  }

  const inputSecret =
    request.headers.get("x-revalidate-secret")?.trim() ||
    payload.secret?.trim() ||
    request.nextUrl.searchParams.get("secret")?.trim() ||
    "";

  if (!inputSecret || !safeCompareSecret(inputSecret, configuredSecret)) {
    console.warn("[revalidate] unauthorized attempt", { source });
    return NextResponse.json(
      {
        ok: false,
        error: "Nao autorizado.",
      },
      { status: 401 },
    );
  }

  const nestedPost = getObject(payload.post);
  const slug = normalizeSlug(
    readFirstString(
      payload.slug,
      payload.post_name,
      nestedPost?.post_name,
      getSlugFromUrl(readFirstString(payload.permalink, payload.post_url, nestedPost?.permalink, nestedPost?.post_url)),
    ),
  );

  const categorySlugs = [
    ...toStringList(payload.categorySlug),
    ...toStringList(payload.categorySlugs),
    ...toStringList(payload.categories),
    ...toStringList(payload.post_category),
    ...toStringList(nestedPost?.categories),
    ...toStringList(nestedPost?.post_category),
  ]
    .map((value) => normalizeSlug(value))
    .filter((value) => Boolean(value) && !/^\d+$/.test(value));

  const extraPaths = toStringList(payload.paths)
    .map((rawPath) => sanitizePath(rawPath))
    .filter((value): value is string => Boolean(value));

  const shouldRevalidateAll =
    parseBoolean(payload.revalidateAll) ||
    parseBoolean((payload as Record<string, unknown>).revalidate_all);

  const paths = new Set<string>();
  paths.add("/");
  paths.add("/busca");
  for (const categoryPath of DEFAULT_CATEGORY_PATHS) {
    paths.add(categoryPath);
  }

  if (slug) {
    paths.add(`/post/${slug}`);
  }

  for (const categorySlug of categorySlugs) {
    paths.add(`/categoria/${categorySlug}`);
  }

  for (const path of extraPaths) {
    paths.add(path);
  }

  if (shouldRevalidateAll) {
    paths.add("/info/sobre");
    paths.add("/info/equipe");
    paths.add("/info/contato");
    paths.add("/info/termos");
  }

  const revalidatedPaths = [...paths];
  console.info("[revalidate] start", {
    source,
    pathCount: revalidatedPaths.length,
    hasSlug: Boolean(slug),
    categoryCount: categorySlugs.length,
    revalidateAll: shouldRevalidateAll,
  });

  for (const path of revalidatedPaths) {
    revalidatePath(path);
  }

  console.info("[revalidate] success", {
    source,
    pathCount: revalidatedPaths.length,
    paths: revalidatedPaths,
  });

  return NextResponse.json({
    ok: true,
    source,
    resolved: {
      slug: slug || null,
      categorySlugs,
      revalidateAll: shouldRevalidateAll,
    },
    revalidatedPaths,
    count: revalidatedPaths.length,
    timestamp: new Date().toISOString(),
  });
}
