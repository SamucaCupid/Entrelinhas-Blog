import { NextRequest, NextResponse } from "next/server";
import type { AdSlotId } from "@/types";

const ALLOWED_SLOTS: AdSlotId[] = [
  "rail-left-desktop",
  "rail-right-desktop",
  "sidebar-home",
  "sidebar-post",
  "sidebar-category",
  "mobile-feed",
];

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeRedirectTarget(value: string | null): string {
  const fallback = "/info/contato";
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return isHttpUrl(trimmed) ? trimmed : fallback;
}

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get("campaignId")?.trim() || "unknown";
  const slot = request.nextUrl.searchParams.get("slot")?.trim() || "unknown";
  const to = sanitizeRedirectTarget(request.nextUrl.searchParams.get("to"));
  const validSlot = ALLOWED_SLOTS.includes(slot as AdSlotId) ? slot : "unknown";

  console.info("[ads] click", {
    campaignId,
    slot: validSlot,
    to,
  });

  return NextResponse.redirect(to, { status: 307 });
}

