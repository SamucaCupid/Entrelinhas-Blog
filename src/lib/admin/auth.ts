import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

type AdminSessionPayload = {
  username: string;
  exp: number;
};

function readAdminConfig() {
  const username = process.env.ADMIN_PANEL_USERNAME?.trim() || "";
  const password = process.env.ADMIN_PANEL_PASSWORD?.trim() || "";
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || "";

  return { username, password, secret };
}

function toBuffer(value: string): Buffer {
  return Buffer.from(value, "utf8");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = toBuffer(left);
  const rightBuffer = toBuffer(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodePayload(payload: AdminSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): AdminSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AdminSessionPayload>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (typeof parsed.username !== "string" || !parsed.username.trim()) {
      return null;
    }

    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) {
      return null;
    }

    return { username: parsed.username.trim(), exp: parsed.exp };
  } catch {
    return null;
  }
}

function buildSessionToken(payload: AdminSessionPayload, secret: string): string {
  const encoded = encodePayload(payload);
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
}

function parseSessionToken(token: string, secret: string): AdminSessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded, secret);
  if (!safeCompare(signature, expected)) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload) {
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function isAdminAuthConfigured(): boolean {
  const { username, password, secret } = readAdminConfig();
  return Boolean(username && password && secret);
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const config = readAdminConfig();
  if (!config.username || !config.password) {
    return false;
  }

  return safeCompare(username.trim(), config.username) && safeCompare(password, config.password);
}

export function createAdminSessionToken(username: string): string | null {
  const { secret } = readAdminConfig();
  if (!secret) {
    return null;
  }

  const payload: AdminSessionPayload = {
    username: username.trim(),
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
  };

  return buildSessionToken(payload, secret);
}

export function readAdminSessionFromRequest(request: NextRequest): AdminSessionPayload | null {
  const { secret } = readAdminConfig();
  if (!secret) {
    return null;
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return parseSessionToken(token, secret);
}

export function readAdminSessionFromCookies(): AdminSessionPayload | null {
  const { secret } = readAdminConfig();
  if (!secret) {
    return null;
  }

  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return parseSessionToken(token, secret);
}

export function getAdminSessionCookieName(): string {
  return ADMIN_SESSION_COOKIE;
}

export function getAdminSessionMaxAge(): number {
  return ADMIN_SESSION_TTL_SECONDS;
}

