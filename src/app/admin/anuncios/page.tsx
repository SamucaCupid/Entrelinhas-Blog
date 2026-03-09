import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllowedAdSlots } from "@/lib/ads/admin";
import { isSupabaseAdsConfigured, listCampaignsForAdmin } from "@/lib/ads/repository";
import { readAdminSessionFromCookies } from "@/lib/admin/auth";
import type { AdCampaign, AdSlotId } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Anuncios",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminAdsPageProps = {
  searchParams?: {
    ok?: string;
    error?: string;
  };
};

function toDateTimeLocal(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function hasSlot(campaign: AdCampaign, slot: AdSlotId): boolean {
  return campaign.slots.includes(slot);
}

function isReadOnlyCampaign(campaign: AdCampaign, isSupabaseReady: boolean): boolean {
  return !isSupabaseReady || campaign.id.startsWith("demo-");
}

function slotLabel(slot: AdSlotId): string {
  if (slot === "rail-left-desktop") return "Lateral esquerda desktop";
  if (slot === "rail-right-desktop") return "Lateral direita desktop";
  if (slot === "sidebar-home") return "Sidebar home";
  if (slot === "sidebar-post") return "Sidebar post";
  if (slot === "sidebar-category") return "Sidebar categoria";
  return "Feed mobile";
}

export default async function AdminAdsPage({ searchParams }: AdminAdsPageProps) {
  const session = readAdminSessionFromCookies();
  if (!session) {
    redirect("/admin/login?error=session_expired&next=/admin/anuncios");
  }

  const campaigns = await listCampaignsForAdmin();
  const slots = getAllowedAdSlots();
  const isSupabaseReady = isSupabaseAdsConfigured();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-slate-950">
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Painel de Anuncios</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Usuario: <strong>{session.username}</strong> | Campanhas cadastradas: <strong>{campaigns.length}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center rounded-lg border border-zinc-300 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-slate-800 transition"
              >
                Voltar ao site
              </Link>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3 py-2 text-sm font-semibold transition"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>

          {!isSupabaseReady && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700">
              Supabase nao configurado. O painel fica em modo leitura/fallback. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para habilitar CRUD sem editar codigo.
            </div>
          )}

          {searchParams?.ok && (
            <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 px-3 py-2 text-sm dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-700">
              {searchParams.ok}
            </div>
          )}

          {searchParams?.error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 text-red-900 px-3 py-2 text-sm dark:bg-red-900/20 dark:text-red-200 dark:border-red-700">
              {searchParams.error}
            </div>
          )}
        </div>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nova campanha</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Preencha os campos e selecione os slots onde o anuncio deve aparecer.</p>

          <form action="/api/admin/ads/create" method="post" encType="multipart/form-data" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">ID da campanha</span>
              <input name="id" required className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Anunciante</span>
              <input name="advertiser" required className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Titulo</span>
              <input name="title" required className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">URL destino</span>
              <input name="targetUrl" required placeholder="https://..." className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Descricao</span>
              <textarea name="description" required rows={3} className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Imagem (arquivo)</span>
              <input type="file" name="imageFile" accept="image/*" className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-zinc-200 dark:file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:cursor-pointer" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Prioridade</span>
              <input name="priority" type="number" defaultValue={0} className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Inicio</span>
              <input name="startAt" type="datetime-local" className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Fim</span>
              <input name="endAt" type="datetime-local" className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Slots</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <label key={slot} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-slate-700 px-3 py-2 text-sm">
                    <input type="checkbox" name="slots" value={slot} />
                    <span>{slotLabel(slot)}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="active" value="true" defaultChecked />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Campanha ativa</span>
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 px-4 py-2.5 font-semibold transition disabled:opacity-50"
                disabled={!isSupabaseReady}
              >
                Criar campanha
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          {campaigns.map((campaign) => {
            const readOnly = isReadOnlyCampaign(campaign, isSupabaseReady);
            return (
            <article key={campaign.id} className="rounded-2xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{campaign.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    ID: {campaign.id} | Anunciante: {campaign.advertiser}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    campaign.active === false
                      ? "bg-zinc-200 text-zinc-700 dark:bg-slate-700 dark:text-zinc-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                  }`}
                >
                  {campaign.active === false ? "Inativa" : "Ativa"}
                </span>
              </div>

              {readOnly && (
                <div className="mt-4 rounded-lg border border-zinc-300 dark:border-slate-600 bg-zinc-50 dark:bg-slate-800/70 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {isSupabaseReady
                    ? "Campanha de exemplo em modo somente leitura."
                    : "Modo somente leitura enquanto o Supabase estiver indisponivel."}
                </div>
              )}

              <form action="/api/admin/ads/update" method="post" encType="multipart/form-data" className="mt-4">
                <fieldset disabled={readOnly} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">ID</span>
                    <input name="id" defaultValue={campaign.id} required readOnly className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-zinc-50 dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Anunciante</span>
                    <input name="advertiser" defaultValue={campaign.advertiser} required className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Titulo</span>
                    <input name="title" defaultValue={campaign.title} required className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">URL destino</span>
                    <input name="targetUrl" defaultValue={campaign.targetUrl} required className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Descricao</span>
                    <textarea name="description" defaultValue={campaign.description} required rows={3} className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Imagem (novo arquivo)</span>
                    <input type="file" name="imageFile" accept="image/*" className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-zinc-200 dark:file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:cursor-pointer" />
                  </label>

                  <input type="hidden" name="currentImageUrl" value={campaign.imageUrl || ""} />

                  <div className="block text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {campaign.imageUrl ? `Imagem atual cadastrada` : "Sem imagem cadastrada"}
                  </div>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Prioridade</span>
                    <input name="priority" type="number" defaultValue={campaign.priority ?? 0} className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Inicio</span>
                    <input name="startAt" type="datetime-local" defaultValue={toDateTimeLocal(campaign.startAt)} className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Fim</span>
                    <input name="endAt" type="datetime-local" defaultValue={toDateTimeLocal(campaign.endAt)} className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </label>

                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Slots</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.map((slot) => (
                        <label key={`${campaign.id}-${slot}`} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-slate-700 px-3 py-2 text-sm">
                          <input type="checkbox" name="slots" value={slot} defaultChecked={hasSlot(campaign, slot)} />
                          <span>{slotLabel(slot)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 md:col-span-2">
                    <input type="checkbox" name="active" value="true" defaultChecked={campaign.active !== false} />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Campanha ativa</span>
                  </label>

                  <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
                      disabled={readOnly}
                    >
                      Salvar alteracoes
                    </button>
                  </div>
                </fieldset>
              </form>

              <form action="/api/admin/ads/delete" method="post" className="mt-3">
                <input type="hidden" name="id" value={campaign.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-300 text-red-700 dark:text-red-300 dark:border-red-700 px-3 py-1.5 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                  disabled={readOnly}
                >
                  Excluir campanha
                </button>
              </form>
            </article>
          );
          })}
        </section>
      </main>
    </div>
  );
}
