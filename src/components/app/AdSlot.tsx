import { getSlotMeta, resolveCampaignForSlotAsync } from "@/lib/ads/service";
import type { AdSlotId } from "@/types";

type AdSlotProps = {
  slot: AdSlotId;
  categorySlug?: string;
  className?: string;
};

function normalizeClassName(value: string | undefined): string {
  return value?.trim() ? ` ${value.trim()}` : "";
}

function toSafeClickHref(campaignId: string, slot: AdSlotId, targetUrl: string): string {
  const params = new URLSearchParams();
  params.set("campaignId", campaignId);
  params.set("slot", slot);
  params.set("to", targetUrl);
  return `/api/ads/click?${params.toString()}`;
}

function toImageSrc(imageUrl: string): string {
  const params = new URLSearchParams();
  params.set("src", imageUrl);
  return `/api/media/image?${params.toString()}`;
}

export async function AdSlot({ slot, categorySlug, className }: AdSlotProps) {
  const slotMeta = getSlotMeta(slot);
  const campaign = await resolveCampaignForSlotAsync({ slot, categorySlug });
  const containerClassName = `${slotMeta.minHeightClassName}${normalizeClassName(className)}`;

  if (!campaign) {
    return null;
  }

  const clickHref = toSafeClickHref(campaign.id, slot, campaign.targetUrl);

  return (
    <a href={clickHref} className={`group relative block overflow-hidden rounded-2xl shadow-sm ${containerClassName}`} aria-label={campaign.title}>
      <div className="absolute inset-0 bg-zinc-200 dark:bg-slate-700" />
      {campaign.imageUrl ? (
        <img
          src={toImageSrc(campaign.imageUrl)}
          alt={campaign.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700" />
      )}
    </a>
  );
}
