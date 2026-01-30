"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type NewsletterSignupProps = {
  variant?: "desktop" | "mobile";
};

export function NewsletterSignup({ variant = "desktop" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  const isMobile = variant === "mobile";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || status !== "idle") return;

    setStatus("sending");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className={isMobile ? "space-y-2" : "flex flex-col gap-2"}>
      <div className={isMobile ? "space-y-2" : "flex gap-2"}>
        <input
          type="email"
          placeholder="seu@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status !== "idle"}
          className={
            isMobile
              ? "w-full px-4 py-3 border border-zinc-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              : "flex-1 px-4 py-2 border bg-white border-zinc-300 text-zinc-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-zinc-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
          }
        />
        <button
          type="submit"
          disabled={status !== "idle"}
          className={
            isMobile
              ? "w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold py-3 rounded-lg transition disabled:opacity-70"
              : "bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold px-6 py-2 rounded-lg transition disabled:opacity-70"
          }
        >
          {status === "sending" ? (
            <span className="inline-flex items-center gap-2">
              <Send size={16} className="animate-spin" />
              Enviando...
            </span>
          ) : (
            "Assinar"
          )}
        </button>
      </div>

      {status === "success" && (
        <div className="rounded-lg bg-green-500/15 border border-green-500 text-green-700 dark:text-green-200 px-3 py-2 text-xs w-full">
          Você foi cadastrado com sucesso, confira sua caixa de mensagens no gmail para prosseguir com as configuracoes.
        </div>
      )}
    </form>
  );
}
