import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromHeaderValues, isIpAllowedForAdmin } from "@/lib/admin/ip-allow";

function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/admin/");
}

export function middleware(request: NextRequest) {
  const clientIp = getClientIpFromHeaderValues({
    xForwardedFor: request.headers.get("x-forwarded-for"),
    xRealIp: request.headers.get("x-real-ip"),
    fallbackIp: request.ip ?? "",
  });

  if (isIpAllowedForAdmin(clientIp)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  console.warn("[admin-ip-allow] blocked request", {
    pathname,
    clientIp: clientIp || "unknown",
  });

  if (isAdminApiPath(pathname)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  return new NextResponse("Not found.", { status: 404 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

