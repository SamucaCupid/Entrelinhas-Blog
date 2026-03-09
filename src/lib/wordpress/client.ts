import "server-only";

import { getWordPressConfig } from "@/lib/wordpress/config";
import { WordPressRequestError } from "@/lib/wordpress/errors";

type QueryValue = string | number | boolean | null | undefined;

type WordPressRequestOptions = {
  query?: Record<string, QueryValue>;
  revalidate?: number;
  cache?: RequestCache;
};

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function wordpressRequest<T>(path: string, options: WordPressRequestOptions = {}): Promise<T> {
  const config = getWordPressConfig();
  const endpoint = buildUrl(config.baseUrl, path, options.query);
  const headers = new Headers({ Accept: "application/json" });

  if (config.accessToken) {
    headers.set("Authorization", `Bearer ${config.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers,
      cache: options.cache,
      next: { revalidate: options.revalidate ?? config.revalidateSeconds },
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    throw new WordPressRequestError("Failed to connect to WordPress CMS.", {
      endpoint,
      cause: error,
    });
  }

  if (!response.ok) {
    throw new WordPressRequestError(`WordPress CMS request failed with status ${response.status}.`, {
      status: response.status,
      endpoint,
    });
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new WordPressRequestError("WordPress CMS returned invalid JSON.", {
      status: response.status,
      endpoint,
      cause: error,
    });
  }
}
