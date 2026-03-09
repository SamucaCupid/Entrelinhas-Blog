import { NextRequest, NextResponse } from "next/server";
import { WordPressConfigError, WordPressRequestError } from "@/lib/wordpress/errors";
import { logWordPressError } from "@/lib/wordpress/logger";
import { listPosts, listPostsByCategorySlug } from "@/lib/wordpress/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLimit(raw: string | null): number | undefined {
  if (!raw) {
    return undefined;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return Math.min(Math.floor(value), 100);
}

function errorResponse(error: unknown) {
  if (error instanceof WordPressConfigError) {
    return NextResponse.json({ error: "CMS configuration is missing." }, { status: 500 });
  }

  if (error instanceof WordPressRequestError) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: "CMS authentication failed." }, { status: 502 });
    }

    if (error.status === 404) {
      return NextResponse.json({ error: "CMS endpoint not found." }, { status: 502 });
    }

    return NextResponse.json({ error: "CMS request failed." }, { status: 502 });
  }

  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const categorySlug = request.nextUrl.searchParams.get("categorySlug")?.trim();

  if (request.nextUrl.searchParams.get("limit") && !limit) {
    return NextResponse.json({ error: "Invalid limit. Use a number between 1 and 100." }, { status: 400 });
  }

  try {
    const posts = categorySlug
      ? await listPostsByCategorySlug(categorySlug, { limit, cache: "no-store", revalidate: 0 })
      : await listPosts({ limit, cache: "no-store", revalidate: 0 });

    return NextResponse.json(
      { posts },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof WordPressRequestError) {
      logWordPressError("api/cms/posts", error, {
        status: error.status,
        endpoint: error.endpoint,
      });
    } else {
      logWordPressError("api/cms/posts", error);
    }

    return errorResponse(error);
  }
}
