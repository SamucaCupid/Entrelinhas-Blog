import "server-only";

import { AD_SLOT_CONFIG } from "@/lib/ads/config";
import { listCampaignsForRender } from "@/lib/ads/repository";
import type { AdCampaign, AdSlotId } from "@/types";

type ResolveAdOptions = {
  slot: AdSlotId;
  categorySlug?: string;
  now?: Date;
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function isWithinDateRange(campaign: AdCampaign, now: Date): boolean {
  if (campaign.startAt) {
    const start = new Date(campaign.startAt);
    if (!Number.isNaN(start.getTime()) && now < start) {
      return false;
    }
  }

  if (campaign.endAt) {
    const end = new Date(campaign.endAt);
    if (!Number.isNaN(end.getTime()) && now > end) {
      return false;
    }
  }

  return true;
}

function matchesCategory(campaign: AdCampaign, categorySlug?: string): boolean {
  if (!campaign.categorySlugs?.length) {
    return true;
  }

  if (!categorySlug) {
    return true;
  }

  const normalizedCategory = normalizeSlug(categorySlug);
  return campaign.categorySlugs.map((value) => normalizeSlug(value)).includes(normalizedCategory);
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function sortCampaigns(campaigns: AdCampaign[]): AdCampaign[] {
  return campaigns.sort((left, right) => {
    const leftPriority = left.priority ?? 0;
    const rightPriority = right.priority ?? 0;

    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }

    return left.id.localeCompare(right.id);
  });
}

export async function resolveCampaignForSlotAsync({ slot, categorySlug, now = new Date() }: ResolveAdOptions): Promise<AdCampaign | null> {
  const campaigns = await listCampaignsForRender();
  const eligible = sortCampaigns(
    campaigns.filter((campaign) => {
      if (campaign.active === false) {
        return false;
      }

      if (!campaign.slots.includes(slot)) {
        return false;
      }

      if (!isWithinDateRange(campaign, now)) {
        return false;
      }

      return matchesCategory(campaign, categorySlug);
    }),
  );

  if (!eligible.length) {
    return null;
  }

  const dayKey = now.toISOString().slice(0, 10);
  const rotationSeed = hashString(`${slot}:${dayKey}:${categorySlug ?? "all"}`);
  const selectedIndex = rotationSeed % eligible.length;
  return eligible[selectedIndex];
}

export function getSlotMeta(slot: AdSlotId) {
  return AD_SLOT_CONFIG[slot];
}
