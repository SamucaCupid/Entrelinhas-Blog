import "server-only";

type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
  timeoutMs: number;
  maxImageBytes: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function readConfig(): SupabaseStorageConfig {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios para upload de imagem.");
  }

  return {
    url: trimTrailingSlashes(url),
    serviceRoleKey,
    bucket: process.env.SUPABASE_ADS_STORAGE_BUCKET?.trim() || "ads-images",
    timeoutMs: parsePositiveInt(process.env.SUPABASE_TIMEOUT_MS, 8000),
    maxImageBytes: parsePositiveInt(process.env.ADS_IMAGE_MAX_BYTES, 5 * 1024 * 1024),
  };
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExtensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase() || "";
  if (/^[a-z0-9]{2,5}$/.test(fromName)) {
    return fromName;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/avif") return "avif";
  return "bin";
}

function encodeObjectPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildPublicUrl(url: string, bucket: string, objectPath: string): string {
  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`;
}

export async function uploadAdImageToSupabaseStorage(file: File, campaignId: string): Promise<string> {
  const config = readConfig();

  if (!file.type?.startsWith("image/")) {
    throw new Error("Arquivo invalido: envie somente imagem.");
  }

  if (file.size <= 0) {
    throw new Error("Arquivo de imagem vazio.");
  }

  if (file.size > config.maxImageBytes) {
    const maxMb = Math.max(1, Math.round(config.maxImageBytes / (1024 * 1024)));
    throw new Error(`Imagem muito grande. Limite atual: ${maxMb}MB.`);
  }

  const safeCampaignId = sanitizeSegment(campaignId) || "campanha";
  const extension = getExtensionFromFile(file);
  const random = Math.random().toString(36).slice(2, 10);
  const objectPath = `campaigns/${safeCampaignId}/${Date.now()}-${random}.${extension}`;
  const uploadUrl = `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeObjectPath(objectPath)}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: Buffer.from(await file.arrayBuffer()),
    cache: "no-store",
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 400 || response.status === 404) {
      throw new Error(
        `Falha no upload de imagem (bucket="${config.bucket}"). Crie um bucket publico no Supabase Storage e tente novamente.`,
      );
    }
    throw new Error(`Falha no upload de imagem status=${response.status} body=${body.slice(0, 250)}`);
  }

  return buildPublicUrl(config.url, config.bucket, objectPath);
}
