import "server-only";

import { cache } from "react";
import { getAdCampaigns as getFallbackAdCampaigns } from "@/lib/ads/config";
import type { AdCampaign } from "@/types";

type SupabaseAdsConfig = {
  url: string;
  serviceRoleKey: string;
  campaignsTable: string;
  auditTable: string | null;
  timeoutMs: number;
};

type AdCampaignRow = {
  id: string;
  advertiser: string;
  title: string;
  description: string;
  target_url: string;
  image_url: string | null;
  slots: string[] | null;
  category_slugs: string[] | null;
  start_at: string | null;
  end_at: string | null;
  priority: number | null;
  active: boolean | null;
};

type UpsertAdCampaignInput = {
  id: string;
  advertiser: string;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl?: string;
  slots: string[];
  categorySlugs?: string[];
  startAt?: string;
  endAt?: string;
  priority?: number;
  active?: boolean;
};

type AuditInput = {
  action: "create" | "update" | "delete";
  actor: string;
  campaignId: string;
  payload?: Record<string, unknown>;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function readSupabaseAdsConfig(): SupabaseAdsConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: trimTrailingSlashes(url),
    serviceRoleKey,
    campaignsTable: process.env.SUPABASE_ADS_TABLE?.trim() || "ad_campaigns",
    auditTable: process.env.SUPABASE_ADS_AUDIT_TABLE?.trim() || "ad_campaign_audit_logs",
    timeoutMs: parsePositiveInt(process.env.SUPABASE_TIMEOUT_MS, 8000),
  };
}

function rowToCampaign(row: AdCampaignRow): AdCampaign {
  return {
    id: row.id,
    advertiser: row.advertiser,
    title: row.title,
    description: row.description,
    targetUrl: row.target_url,
    imageUrl: row.image_url || undefined,
    slots: (row.slots ?? []) as AdCampaign["slots"],
    categorySlugs: row.category_slugs ?? undefined,
    startAt: row.start_at ?? undefined,
    endAt: row.end_at ?? undefined,
    priority: row.priority ?? undefined,
    active: row.active ?? true,
  };
}

function campaignToRow(input: UpsertAdCampaignInput): Omit<AdCampaignRow, "active"> & { active: boolean } {
  return {
    id: input.id,
    advertiser: input.advertiser,
    title: input.title,
    description: input.description,
    target_url: input.targetUrl,
    image_url: input.imageUrl ?? null,
    slots: input.slots,
    category_slugs: input.categorySlugs?.length ? input.categorySlugs : null,
    start_at: input.startAt ?? null,
    end_at: input.endAt ?? null,
    priority: input.priority ?? 0,
    active: input.active ?? true,
  };
}

async function requestSupabase<T>(
  config: SupabaseAdsConfig,
  path: string,
  init: RequestInit & { revalidateSeconds?: number; noStore?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  headers.set("Accept", "application/json");

  if (init.body && !headers.get("content-type")) {
    headers.set("Content-Type", "application/json");
  }

  const endpoint = `${config.url}/rest/v1/${path}`;
  const requestInit: RequestInit = {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    cache: init.noStore ? "no-store" : undefined,
    next: init.noStore ? { revalidate: 0 } : { revalidate: init.revalidateSeconds ?? 60 },
    signal: AbortSignal.timeout(config.timeoutMs),
  };

  const response = await fetch(endpoint, requestInit);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`supabase request failed status=${response.status} path=${path} body=${body.slice(0, 300)}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function insertAuditLog(config: SupabaseAdsConfig, input: AuditInput): Promise<void> {
  if (!config.auditTable) {
    return;
  }

  try {
    await requestSupabase(config, config.auditTable, {
      method: "POST",
      body: JSON.stringify([
        {
          action: input.action,
          actor: input.actor,
          campaign_id: input.campaignId,
          payload: input.payload ?? null,
          created_at: new Date().toISOString(),
        },
      ]),
      headers: {
        Prefer: "return=minimal",
      },
      noStore: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ads] audit insert failed message="${message}"`);
  }
}

const listCampaignsForRenderCached = cache(async (): Promise<AdCampaign[]> => {
  const config = readSupabaseAdsConfig();
  if (!config) {
    return getFallbackAdCampaigns();
  }

  try {
    const rows = await requestSupabase<AdCampaignRow[]>(config, `${config.campaignsTable}?select=*&order=priority.desc,id.asc`, {
      revalidateSeconds: parsePositiveInt(process.env.ADS_CACHE_SECONDS, 60),
    });
    return rows.map(rowToCampaign);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ads] listCampaignsForRender fallback message="${message}"`);
    return getFallbackAdCampaigns();
  }
});

export function isSupabaseAdsConfigured(): boolean {
  return Boolean(readSupabaseAdsConfig());
}

export async function listCampaignsForRender(): Promise<AdCampaign[]> {
  return listCampaignsForRenderCached();
}

export async function listCampaignsForAdmin(): Promise<AdCampaign[]> {
  const config = readSupabaseAdsConfig();
  if (!config) {
    return getFallbackAdCampaigns();
  }

  try {
    const rows = await requestSupabase<AdCampaignRow[]>(config, `${config.campaignsTable}?select=*&order=priority.desc,id.asc`, {
      noStore: true,
    });
    return rows.map(rowToCampaign);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ads] listCampaignsForAdmin fallback message="${message}"`);
    return getFallbackAdCampaigns();
  }
}

export async function createCampaign(input: UpsertAdCampaignInput, actor: string): Promise<AdCampaign> {
  const config = readSupabaseAdsConfig();
  if (!config) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin campaign writes.");
  }

  const row = campaignToRow(input);
  const createdRows = await requestSupabase<AdCampaignRow[]>(config, config.campaignsTable, {
    method: "POST",
    body: JSON.stringify([row]),
    headers: {
      Prefer: "return=representation",
    },
    noStore: true,
  });
  const created = createdRows[0];
  await insertAuditLog(config, {
    action: "create",
    actor,
    campaignId: created.id,
    payload: { id: created.id, slots: created.slots, active: created.active },
  });

  return rowToCampaign(created);
}

export async function updateCampaign(input: UpsertAdCampaignInput, actor: string): Promise<AdCampaign | null> {
  const config = readSupabaseAdsConfig();
  if (!config) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin campaign writes.");
  }

  const row = campaignToRow(input);
  const filter = encodeURIComponent(`eq.${input.id}`);
  const updatedRows = await requestSupabase<AdCampaignRow[]>(
    config,
    `${config.campaignsTable}?id=${filter}`,
    {
      method: "PATCH",
      body: JSON.stringify(row),
      headers: {
        Prefer: "return=representation",
      },
      noStore: true,
    },
  );
  const updated = updatedRows[0] ?? null;
  if (!updated) {
    return null;
  }

  await insertAuditLog(config, {
    action: "update",
    actor,
    campaignId: updated.id,
    payload: { id: updated.id, slots: updated.slots, active: updated.active },
  });

  return rowToCampaign(updated);
}

export async function deleteCampaign(id: string, actor: string): Promise<void> {
  const config = readSupabaseAdsConfig();
  if (!config) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin campaign writes.");
  }

  const filter = encodeURIComponent(`eq.${id}`);
  await requestSupabase<null>(config, `${config.campaignsTable}?id=${filter}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
    noStore: true,
  });

  await insertAuditLog(config, {
    action: "delete",
    actor,
    campaignId: id,
  });
}
