import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminSessionCookieName,
  getAdminSessionMaxAge,
  isAdminAuthConfigured,
  validateAdminCredentials,
} from "@/lib/admin/auth";
import { getClientIpFromHeaderValues } from "@/lib/admin/ip-allow";
import { checkAdminLoginLimit, clearAdminLoginFailures, registerAdminLoginFailure } from "@/lib/admin/rate-limit";

function sanitizeNextPath(value: string | null): string {
  if (!value) {
    return "/admin/anuncios";
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/admin/anuncios";
  }

  return trimmed;
}

function getRequestIp(request: NextRequest): string {
  const ip = getClientIpFromHeaderValues({
    xForwardedFor: request.headers.get("x-forwarded-for"),
    xRealIp: request.headers.get("x-real-ip"),
    fallbackIp: request.ip ?? "",
  });
  return ip || "unknown";
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=admin_not_configured", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeNextPath(String(formData.get("next") ?? ""));
  const ip = getRequestIp(request);
  const limitKey = `${ip}:${username || "unknown"}`;
  const limitCheck = checkAdminLoginLimit(limitKey);
  if (!limitCheck.allowed) {
    const target = new URL("/admin/login?error=too_many_attempts", request.url);
    target.searchParams.set("retry", String(limitCheck.retryAfterSeconds));
    target.searchParams.set("next", nextPath);
    return NextResponse.redirect(target, { status: 303 });
  }

  if (!validateAdminCredentials(username, password)) {
    registerAdminLoginFailure(limitKey);
    const target = new URL("/admin/login?error=invalid_credentials", request.url);
    target.searchParams.set("next", nextPath);
    return NextResponse.redirect(target, { status: 303 });
  }

  clearAdminLoginFailures(limitKey);
  const token = createAdminSessionToken(username);
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login?error=session_error", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set(getAdminSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAdminSessionMaxAge(),
  });

  return response;
}
