import { NextRequest, NextResponse } from "next/server";
import { updateCampaignFromForm } from "@/lib/ads/admin";
import { revalidateAdPages } from "@/lib/ads/revalidate";
import { readAdminSessionFromRequest } from "@/lib/admin/auth";

function redirectWithStatus(request: NextRequest, status: "ok" | "error", message: string) {
  const url = new URL("/admin/anuncios", request.url);
  url.searchParams.set(status, message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const session = readAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login?error=session_expired&next=/admin/anuncios", request.url), { status: 303 });
  }

  const formData = await request.formData();
  try {
    const result = await updateCampaignFromForm(formData, session.username);
    if (!result.ok) {
      return redirectWithStatus(request, "error", result.error ?? "Falha ao atualizar campanha.");
    }

    revalidateAdPages();
    return redirectWithStatus(request, "ok", "Campanha atualizada com sucesso.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao atualizar campanha.";
    return redirectWithStatus(request, "error", message);
  }
}
