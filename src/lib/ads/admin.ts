import "server-only";

import { createCampaign, deleteCampaign, updateCampaign } from "@/lib/ads/repository";
import { uploadAdImageToSupabaseStorage } from "@/lib/ads/storage";
import type { AdSlotId } from "@/types";

const ALLOWED_SLOTS: AdSlotId[] = [
  "rail-left-desktop",
  "rail-right-desktop",
  "sidebar-home",
  "sidebar-post",
  "sidebar-category",
  "mobile-feed",
];

type CampaignInput = {
  id: string;
  advertiser: string;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl?: string;
  slots: AdSlotId[];
  startAt?: string;
  endAt?: string;
  priority?: number;
  active: boolean;
};

type FormValidationResult = {
  ok: boolean;
  error?: string;
  data?: CampaignInput;
};

function normalizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseBool(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes";
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.floor(parsed);
}

function parseDate(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function isTargetUrlValid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCampaignForm(formData: FormData): FormValidationResult {
  const id = normalizeId(String(formData.get("id") ?? ""));
  const advertiser = String(formData.get("advertiser") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetUrl = String(formData.get("targetUrl") ?? "").trim();
  const priority = parseNumber(String(formData.get("priority") ?? ""));
  const active = parseBool(String(formData.get("active") ?? ""));
  const startAt = parseDate(String(formData.get("startAt") ?? ""));
  const endAt = parseDate(String(formData.get("endAt") ?? ""));

  const slotsRaw = formData.getAll("slots");
  const slots = slotsRaw
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value): value is AdSlotId => ALLOWED_SLOTS.includes(value as AdSlotId));

  if (!id) {
    return { ok: false, error: "ID da campanha e obrigatorio." };
  }

  if (!advertiser || !title || !description) {
    return { ok: false, error: "Anunciante, titulo e descricao sao obrigatorios." };
  }

  if (!isTargetUrlValid(targetUrl)) {
    return { ok: false, error: "URL de destino invalida. Use URL completa ou caminho local (/rota)." };
  }

  if (!slots.length) {
    return { ok: false, error: "Selecione ao menos um slot." };
  }

  if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
    return { ok: false, error: "A data de inicio nao pode ser maior que a data de fim." };
  }

  return {
    ok: true,
    data: {
      id,
      advertiser,
      title,
      description,
      targetUrl,
      slots,
      startAt,
      endAt,
      priority,
      active,
    },
  };
}

function readOptionalString(formData: FormData, fieldName: string): string | undefined {
  const value = String(formData.get(fieldName) ?? "").trim();
  return value || undefined;
}

function readImageFile(formData: FormData): File | null {
  const value = formData.get("imageFile");
  if (!value || typeof value === "string") {
    return null;
  }

  if (typeof (value as File).arrayBuffer !== "function") {
    return null;
  }

  const file = value as File;
  if (file.size <= 0) {
    return null;
  }

  return file;
}

async function resolveImageUrl(formData: FormData, campaignId: string, fallbackImageUrl?: string): Promise<string | undefined> {
  const imageFile = readImageFile(formData);
  if (!imageFile) {
    return fallbackImageUrl;
  }

  return uploadAdImageToSupabaseStorage(imageFile, campaignId);
}

export async function createCampaignFromForm(formData: FormData, actor: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = validateCampaignForm(formData);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error ?? "Dados invalidos." };
  }

  const imageUrl = await resolveImageUrl(formData, parsed.data.id);
  await createCampaign({ ...parsed.data, imageUrl }, actor);
  return { ok: true };
}

export async function updateCampaignFromForm(formData: FormData, actor: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = validateCampaignForm(formData);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error ?? "Dados invalidos." };
  }

  const currentImageUrl = readOptionalString(formData, "currentImageUrl");
  const imageUrl = await resolveImageUrl(formData, parsed.data.id, currentImageUrl);
  const updated = await updateCampaign({ ...parsed.data, imageUrl }, actor);
  if (!updated) {
    return { ok: false, error: "Campanha nao encontrada para atualizar." };
  }

  return { ok: true };
}

export async function deleteCampaignFromForm(formData: FormData, actor: string): Promise<{ ok: boolean; error?: string }> {
  const id = normalizeId(String(formData.get("id") ?? ""));
  if (!id) {
    return { ok: false, error: "ID da campanha e obrigatorio para excluir." };
  }

  await deleteCampaign(id, actor);
  return { ok: true };
}

export function getAllowedAdSlots(): AdSlotId[] {
  return ALLOWED_SLOTS;
}
