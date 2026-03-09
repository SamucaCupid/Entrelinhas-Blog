import "server-only";

import type { Category, PostUI } from "@/types";
import { WordPressRequestError } from "@/lib/wordpress/errors";
import { logWordPressError } from "@/lib/wordpress/logger";
import {
  getPostBySlugFromService,
  listCategories,
  listPosts,
  listPostsByCategorySlug,
} from "@/lib/wordpress/service";

type CmsReadOptions = {
  revalidate?: number;
  cache?: RequestCache;
};

const EDITORIAL_CATEGORIES: Category[] = [
  { id: -1, name: "Politica", slug: "politica", count: 0 },
  { id: -2, name: "Policia", slug: "policia", count: 0 },
  { id: -3, name: "Eventos", slug: "eventos", count: 0 },
  { id: -4, name: "Negocios", slug: "negocios", count: 0 },
  { id: -5, name: "Cultura", slug: "cultura", count: 0 },
];

function mergeEditorialCategories(cmsCategories: Category[]): Category[] {
  const filteredCms = cmsCategories.filter((category) => {
    const slug = category.slug.trim().toLowerCase();
    return slug !== "uncategorized" && slug !== "urgente";
  });
  const cmsBySlug = new Map(filteredCms.map((category) => [category.slug, category]));

  const mergedBase = EDITORIAL_CATEGORIES.map((category) => cmsBySlug.get(category.slug) ?? category);
  const additionalCms = filteredCms.filter((category) => !EDITORIAL_CATEGORIES.some((base) => base.slug === category.slug));

  return [...mergedBase, ...additionalCms];
}

function logError(operation: string, error: unknown) {
  if (error instanceof WordPressRequestError) {
    logWordPressError(operation, error, {
      status: error.status,
      endpoint: error.endpoint,
    });
    return;
  }

  logWordPressError(operation, error);
}

export async function getPosts(limit?: number, options: CmsReadOptions = {}): Promise<PostUI[]> {
  try {
    return await listPosts({ limit, ...options });
  } catch (error) {
    logError("getPosts", error);
    return [];
  }
}

export async function getPostBySlug(slug: string, options: CmsReadOptions = {}): Promise<PostUI | null> {
  try {
    return await getPostBySlugFromService(slug, options);
  } catch (error) {
    logError("getPostBySlug", error);
    return null;
  }
}

export async function getCategories(options: CmsReadOptions = {}): Promise<Category[]> {
  try {
    const cmsCategories = await listCategories(options);
    return mergeEditorialCategories(cmsCategories);
  } catch (error) {
    logError("getCategories", error);
    return EDITORIAL_CATEGORIES;
  }
}

export async function getPostsByCategory(categorySlug: string, options: CmsReadOptions = {}): Promise<PostUI[]> {
  try {
    return await listPostsByCategorySlug(categorySlug, options);
  } catch (error) {
    logError("getPostsByCategory", error);
    return [];
  }
}
