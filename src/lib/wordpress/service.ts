import "server-only";

import type { Category, PostUI } from "@/types";
import { wordpressRequest } from "@/lib/wordpress/client";

type ServiceOptions = {
  revalidate?: number;
  cache?: RequestCache;
};

type ListPostsOptions = ServiceOptions & {
  limit?: number;
  categoryId?: number;
  slug?: string;
};

type WordPressRendered = {
  rendered?: string;
};

type WordPressFeaturedMedia = {
  source_url?: string;
};

type WordPressTerm = {
  name?: string;
  slug?: string;
};

type WordPressPost = {
  id: number;
  slug: string;
  title?: WordPressRendered;
  excerpt?: WordPressRendered;
  content?: WordPressRendered;
  date: string;
  jetpack_featured_media_url?: string;
  _embedded?: {
    "wp:featuredmedia"?: WordPressFeaturedMedia[];
    "wp:term"?: WordPressTerm[][];
  };
};

type WordPressCategory = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

const CATEGORY_REVALIDATE_SECONDS = 120;

function normalizeCategorySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function clampPerPage(value?: number): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const safe = Math.floor(value);
  if (!Number.isFinite(safe)) {
    return undefined;
  }

  return Math.min(Math.max(safe, 1), 100);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeHtmlContent(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<(object|embed|form|input|button|textarea|select|meta|link)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("|\')\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
}

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  hellip: "...",
  quot: '"',
};

function safeFromCodePoint(value: number): string {
  if (!Number.isInteger(value)) {
    return "";
  }

  if (value < 0 || value > 0x10ffff) {
    return "";
  }

  if (value >= 0xd800 && value <= 0xdfff) {
    return "";
  }

  return String.fromCodePoint(value);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&(#\d+|#x[a-f0-9]+|[a-z]+);/gi, (_, rawEntity: string) => {
      const entity = rawEntity.toLowerCase();

      if (entity.startsWith("#x")) {
        const codePoint = Number.parseInt(entity.slice(2), 16);
        return Number.isFinite(codePoint) ? safeFromCodePoint(codePoint) : "";
      }

      if (entity.startsWith("#")) {
        const codePoint = Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(codePoint) ? safeFromCodePoint(codePoint) : "";
      }

      return HTML_ENTITY_MAP[entity] ?? "";
    })
    .replace(/\u00a0/g, " ");
}

function normalizeRenderedText(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const withoutHtml = stripHtml(value);
  return decodeHtmlEntities(withoutHtml).replace(/\s+/g, " ").trim();
}

function toExcerpt(renderedExcerpt: string | undefined, renderedContent: string | undefined): string {
  const raw = renderedExcerpt?.trim() ? renderedExcerpt : renderedContent ?? "";
  return normalizeRenderedText(raw).slice(0, 200);
}

function pickContextCategory(categories: WordPressTerm[] | undefined): WordPressTerm | undefined {
  if (!categories?.length) {
    return undefined;
  }

  const preferred = categories.find((category) => {
    const slug = normalizeCategorySlug(category.slug ?? "");
    return slug !== "urgente" && slug !== "uncategorized";
  });

  return preferred ?? categories[0];
}

function normalizePost(post: WordPressPost): PostUI {
  const categories = post._embedded?.["wp:term"]?.[0];
  const category = pickContextCategory(categories);
  const featuredImage =
    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || post.jetpack_featured_media_url || "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200";

  return {
    id: post.id,
    slug: post.slug,
    title: normalizeRenderedText(post.title?.rendered) || "Sem titulo",
    excerpt: toExcerpt(post.excerpt?.rendered, post.content?.rendered),
    content: sanitizeHtmlContent(post.content?.rendered),
    date: post.date,
    featuredImageUrl: featuredImage,
    categoryName: decodeHtmlEntities(category?.name || "Sem categoria"),
    categorySlug: category?.slug || "sem-categoria",
  };
}

export async function listPosts(options: ListPostsOptions = {}): Promise<PostUI[]> {
  const posts = await wordpressRequest<WordPressPost[]>("/posts", {
    query: {
      _embed: 1,
      per_page: clampPerPage(options.limit),
      categories: options.categoryId,
      slug: options.slug,
      status: "publish",
    },
    revalidate: options.revalidate,
    cache: options.cache,
  });

  return posts.map(normalizePost);
}

export async function getPostBySlugFromService(slug: string, options: ServiceOptions = {}): Promise<PostUI | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return null;
  }

  const posts = await listPosts({
    slug: normalizedSlug,
    limit: 1,
    revalidate: options.revalidate,
    cache: options.cache,
  });

  return posts[0] ?? null;
}

export async function listCategories(options: ServiceOptions = {}): Promise<Category[]> {
  const categories = await wordpressRequest<WordPressCategory[]>("/categories", {
    query: {
      per_page: 100,
      hide_empty: false,
    },
    revalidate: options.revalidate ?? CATEGORY_REVALIDATE_SECONDS,
    cache: options.cache,
  });

  return categories.map((category) => ({
    id: category.id,
    name: decodeHtmlEntities(category.name),
    slug: category.slug,
    count: category.count,
  }));
}

export async function listPostsByCategorySlug(categorySlug: string, options: ListPostsOptions = {}): Promise<PostUI[]> {
  const normalizedSlug = normalizeCategorySlug(categorySlug);
  if (!normalizedSlug) {
    return [];
  }

  const categoryRevalidateSeconds = options.revalidate ?? CATEGORY_REVALIDATE_SECONDS;

  const categories = await wordpressRequest<WordPressCategory[]>("/categories", {
    query: {
      slug: normalizedSlug,
      per_page: 1,
      hide_empty: false,
    },
    revalidate: categoryRevalidateSeconds,
    cache: options.cache,
  });
  const category = categories[0];

  if (!category) {
    return [];
  }

  return listPosts({
    limit: options.limit,
    categoryId: category.id,
    revalidate: categoryRevalidateSeconds,
    cache: options.cache,
  });
}
