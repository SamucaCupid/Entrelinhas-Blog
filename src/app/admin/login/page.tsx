import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthConfigured, readAdminSessionFromCookies } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
    logout?: string;
    retry?: string;
  };
};

function resolveErrorMessage(code: string | undefined, retrySecondsRaw: string | undefined): string {
  if (!code) {
    return "";
  }

  if (code === "invalid_credentials") {
    return "Usuario ou senha invalidos.";
  }

  if (code === "session_expired") {
    return "Sessao expirada. Faca login novamente.";
  }

  if (code === "admin_not_configured") {
    return "Painel admin nao configurado. Defina ADMIN_PANEL_USERNAME, ADMIN_PANEL_PASSWORD e ADMIN_SESSION_SECRET.";
  }

  if (code === "too_many_attempts") {
    const retrySeconds = Number(retrySecondsRaw);
    const safeRetry = Number.isFinite(retrySeconds) && retrySeconds > 0 ? Math.ceil(retrySeconds / 60) : null;
    if (safeRetry) {
      return `Muitas tentativas. Aguarde aproximadamente ${safeRetry} minuto(s) e tente novamente.`;
    }

    return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
  }

  return "Nao foi possivel autenticar.";
}

function sanitizeNextPath(value: string | undefined): string {
  if (!value) {
    return "/admin/anuncios";
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/admin/anuncios";
  }

  return trimmed;
}

export default function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = readAdminSessionFromCookies();
  if (session) {
    redirect("/admin/anuncios");
  }

  const configured = isAdminAuthConfigured();
  const nextPath = sanitizeNextPath(searchParams?.next);
  const errorMessage = resolveErrorMessage(searchParams?.error, searchParams?.retry);
  const didLogout = searchParams?.logout === "1";

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 p-6 shadow-lg">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Admin de Publicidade</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Acesso restrito para gestao de campanhas do portal.</p>

        {!configured && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700">
            Configure as variaveis de admin no servidor antes de tentar login.
          </div>
        )}

        {didLogout && (
          <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 px-3 py-2 text-sm dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-700">
            Logout realizado com sucesso.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 text-red-900 px-3 py-2 text-sm dark:bg-red-900/20 dark:text-red-200 dark:border-red-700">
            {errorMessage}
          </div>
        )}

        <form action="/api/admin/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Usuario</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-zinc-900 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Senha</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-zinc-900 dark:text-white"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold py-2.5 transition"
            disabled={!configured}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
