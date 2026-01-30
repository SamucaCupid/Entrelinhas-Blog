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
