import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionCookieName } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login?logout=1", request.url), { status: 303 });
  response.cookies.set(getAdminSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

