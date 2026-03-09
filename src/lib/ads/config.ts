import "server-only";

import type { AdCampaign, AdSlotId } from "@/types";

export type AdSlotConfig = {
  title: string;
  minHeightClassName: string;
};

export const AD_SLOT_CONFIG: Record<AdSlotId, AdSlotConfig> = {
  "rail-left-desktop": {
    title: "Lateral esquerda",
    minHeightClassName: "min-h-[640px]",
  },
  "rail-right-desktop": {
    title: "Lateral direita",
    minHeightClassName: "min-h-[640px]",
  },
  "sidebar-home": {
    title: "Sidebar home",
    minHeightClassName: "min-h-[340px]",
  },
  "sidebar-post": {
    title: "Sidebar post",
    minHeightClassName: "min-h-[340px]",
  },
  "sidebar-category": {
    title: "Sidebar categoria",
    minHeightClassName: "min-h-[340px]",
  },
  "mobile-feed": {
    title: "Feed mobile",
    minHeightClassName: "min-h-[180px]",
  },
};

const CAMPAIGNS: AdCampaign[] = [
  {
    id: "demo-anunciante-1",
    advertiser: "Anunciante Demo",
    title: "Sua marca em destaque no Entrelinhas",
    description: "Plano demo para validar layout e fluxo de publicidade no portal.",
    targetUrl: "/info/contato",
    slots: ["rail-left-desktop", "rail-right-desktop", "sidebar-home", "sidebar-post", "sidebar-category", "mobile-feed"],
    startAt: "2026-01-01T00:00:00.000Z",
    endAt: "2030-12-31T23:59:59.000Z",
    priority: 1,
    active: false,
  },
];

function parseFlag(value: string | undefined, fallback: boolean): boolean {
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

function readJsonCampaignsFromEnv(): AdCampaign[] {
  const raw = process.env.AD_CAMPAIGNS_JSON?.trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is AdCampaign => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<AdCampaign>;
      return Boolean(
        candidate.id &&
          candidate.advertiser &&
          candidate.title &&
          candidate.description &&
          candidate.targetUrl &&
          Array.isArray(candidate.slots) &&
          candidate.slots.length,
      );
    });
  } catch {
    console.error("[ads] AD_CAMPAIGNS_JSON invalid json");
    return [];
  }
}

export function getAdCampaigns(): AdCampaign[] {
  const enabled = parseFlag(process.env.AD_SYSTEM_ENABLED, true);
  if (!enabled) {
    return [];
  }

  const envCampaigns = readJsonCampaignsFromEnv();
  if (envCampaigns.length) {
    return envCampaigns;
  }

  return CAMPAIGNS;
}
