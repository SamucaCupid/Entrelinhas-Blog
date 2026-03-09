import { NextResponse } from "next/server";
import { WordPressConfigError, WordPressRequestError } from "@/lib/wordpress/errors";
import { logWordPressError } from "@/lib/wordpress/logger";
import { getPostBySlugFromService } from "@/lib/wordpress/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: {
    slug: string;
  };
};

function errorResponse(error: unknown) {
  if (error instanceof WordPressConfigError) {
    return NextResponse.json({ error: "CMS configuration is missing." }, { status: 500 });
  }

  if (error instanceof WordPressRequestError) {
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json({ error: "CMS authentication failed." }, { status: 502 });
    }

    if (error.status === 404) {
      return NextResponse.json({ error: "Post not found in CMS." }, { status: 404 });
    }

    return NextResponse.json({ error: "CMS request failed." }, { status: 502 });
  }

  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}

export async function GET(_: Request, context: RouteContext) {
  const slug = context.params.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  }

  try {
    const post = await getPostBySlugFromService(slug, { cache: "no-store", revalidate: 0 });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json(
      { post },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof WordPressRequestError) {
      logWordPressError("api/cms/posts/[slug]", error, {
        status: error.status,
        endpoint: error.endpoint,
      });
    } else {
      logWordPressError("api/cms/posts/[slug]", error);
    }

    return errorResponse(error);
  }
}
