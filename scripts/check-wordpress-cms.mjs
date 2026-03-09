#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const env = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const eq = line.indexOf("=");
    if (eq < 1) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  return env;
}

function envValue(key, fromFile) {
  const fromProcess = process.env[key];
  if (fromProcess && fromProcess.trim()) {
    return fromProcess.trim();
  }

  const fromLocal = fromFile[key];
  if (fromLocal && fromLocal.trim()) {
    return fromLocal.trim();
  }

  return "";
}

function isPlaceholderToken(value) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("coloque") ||
    normalized.includes("seu_token") ||
    normalized.includes("your_token") ||
    normalized.includes("token_aqui") ||
    normalized === "changeme"
  );
}

function tokenMask(token) {
  if (!token) {
    return "(empty)";
  }

  if (token.length <= 8) {
    return `${token.slice(0, 2)}***${token.slice(-2)}`;
  }

  return `${token.slice(0, 4)}***${token.slice(-4)}`;
}

function fail(message, details = "") {
  console.error(`[cms:check] FAIL: ${message}`);
  if (details) {
    console.error(details);
  }
  process.exit(1);
}

async function requestPosts(url, token) {
  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { headers });
}

async function main() {
  const envFile = readEnvFile(path.join(cwd, ".env.local"));
  const site = envValue("WORDPRESS_COM_SITE", envFile);
  const rawToken = envValue("WORDPRESS_COM_ACCESS_TOKEN", envFile);
  const token = rawToken && !isPlaceholderToken(rawToken) ? rawToken : "";
  const apiBase = envValue("WORDPRESS_COM_API_BASE", envFile) || "https://public-api.wordpress.com/wp/v2/sites";

  if (!site) {
    fail("WORDPRESS_COM_SITE is missing.");
  }

  const url = `${apiBase.replace(/\/+$/, "")}/${encodeURIComponent(site)}/posts?per_page=1&status=publish&_fields=id,slug,title,date`;
  console.log(`[cms:check] Requesting ${url}`);
  console.log(`[cms:check] Token mask: ${token ? tokenMask(token) : "(none)"}`);

  let response;
  try {
    response = await requestPosts(url, token || undefined);
  } catch (error) {
    fail("Connection error to WordPress API.", error instanceof Error ? error.message : String(error));
    return;
  }

  if ((response.status === 401 || response.status === 403) && token) {
    console.warn("[cms:check] WARN: token was rejected; retrying without token.");
    try {
      response = await requestPosts(url);
    } catch (error) {
      fail("Connection error to WordPress API.", error instanceof Error ? error.message : String(error));
      return;
    }
  }

  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch {
      body = "(unable to read body)";
    }

    if (response.status === 401 || response.status === 403) {
      fail(
        "WordPress API requires authentication for this site.",
        "Configure WORDPRESS_COM_ACCESS_TOKEN with a valid token in .env.local.",
      );
    }

    fail(`WordPress API returned HTTP ${response.status}.`, body);
  }

  let posts = [];
  try {
    posts = await response.json();
  } catch (error) {
    fail("Invalid JSON from WordPress API.", error instanceof Error ? error.message : String(error));
    return;
  }

  const first = Array.isArray(posts) ? posts[0] : null;
  const mode = token ? "private-auth" : "public-no-token";
  if (first?.id && first?.slug) {
    console.log(`[cms:check] OK: connected (${mode}). First post id=${first.id} slug=${first.slug}`);
  } else {
    console.log(`[cms:check] OK: connected (${mode}). No published posts returned.`);
  }
}

main();
