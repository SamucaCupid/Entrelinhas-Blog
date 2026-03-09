import { NextRequest, NextResponse } from "next/server";

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function getAllowedStoragePrefix(): string | null {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return null;
  }

  return `${trimTrailingSlashes(supabaseUrl)}/storage/v1/object/public/`;
}

function isAllowedImageUrl(src: string, allowedPrefix: string | null): boolean {
  if (!allowedPrefix) {
    return false;
  }

  return src.startsWith(allowedPrefix);
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src")?.trim();
  if (!src) {
    return new NextResponse("src ausente", { status: 400 });
  }

  const allowedPrefix = getAllowedStoragePrefix();
  if (!isAllowedImageUrl(src, allowedPrefix)) {
    return new NextResponse("origem nao permitida", { status: 403 });
  }

  try {
    const upstream = await fetch(src, {
      cache: "force-cache",
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return new NextResponse("imagem indisponivel", { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch {
    return new NextResponse("falha ao buscar imagem", { status: 504 });
  }
}
