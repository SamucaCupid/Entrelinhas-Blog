export interface PostUI {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  content?: string;
  featuredImageUrl?: string;
  categoryName?: string;
  categorySlug?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface CityEventUI {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  href: string;
}

export type AdSlotId =
  | "rail-left-desktop"
  | "rail-right-desktop"
  | "sidebar-home"
  | "sidebar-post"
  | "sidebar-category"
  | "mobile-feed";

export interface AdCampaign {
  id: string;
  advertiser: string;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl?: string;
  slots: AdSlotId[];
  categorySlugs?: string[];
  startAt?: string;
  endAt?: string;
  priority?: number;
  active?: boolean;
}
