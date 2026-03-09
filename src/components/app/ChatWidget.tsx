"use client";

import { useMemo, useState } from "react";
import { Send, X } from "lucide-react";
import type { Category } from "@/types";

type ChatWidgetProps = {
  categories?: Category[];
};

const DEFAULT_WHATSAPP_NUMBER = "5577988397862";

const NEIGHBORHOOD_GROUPS = [
  {
    label: "Zona Urbana",
    options: [
      "Alegria",
      "Alto Maron",
      "Bairro Brasil",
      "Bateias",
      "Boa Vista",
      "Bruno Bacelar",
      "Campinhos",
      "Candeias",
      "Centro",
      "Cidade Modelo",
      "Conveima I",
      "Conveima II",
      "Cruzeiro",
      "Felicia",
      "Flamengo",
      "Guarani",
      "Ibirapuera",
      "Iracema",
      "Jatoba",
      "Jurema",
      "Kadija",
      "Lagoa das Bateias",
      "Lagoa das Flores",
      "Miro Cairo",
      "Morada Nova",
      "Morada dos Passaros",
      "Nossa Senhora Aparecida",
      "Patagonia",
      "Primavera",
      "Recreio",
      "Santa Cecilia",
      "Santa Cruz",
      "Sao Pedro",
      "Sao Vicente",
      "Senhorinha Cairo",
      "Simao",
      "Sumare",
      "Urbis I",
      "Urbis II",
      "Urbis III",
      "Urbis IV",
      "Urbis V",
      "Vila America",
      "Vila Elisa",
      "Vila Serrana I",
      "Vila Serrana II",
      "Zabele",
    ],
  },
  {
    label: "Zona Rural (Distritos)",
    options: [
      "Bate-Pe",
      "Cabeceira do Jiboia",
      "Cercadinho",
      "Dantelandia",
      "Igua",
      "Inhobim",
      "Jose Goncalves",
      "Pradoso",
      "Sao Joao da Vitoria",
      "Sao Sebastiao",
      "Veredinha",
    ],
  },
];

function sanitizeWhatsAppNumber(value: string): string {
  return value.replace(/\D/g, "");
}

function getCurrentTimeLabel(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function buildReportMessage(neighborhood: string, referencePoint: string): string {
  const timeLabel = getCurrentTimeLabel();
  const safeNeighborhood = neighborhood.trim() || "informar bairro/localidade";
  const safeReferencePoint = referencePoint.trim() || "sem ponto de referencia";

  return `Ola, gostaria de enviar um flagrante que aconteceu as ${timeLabel} no bairro/localidade ${safeNeighborhood}, ponto de referencia ${safeReferencePoint}.`;
}

export function ChatWidget({ categories: _categories }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [neighborhood, setNeighborhood] = useState("");
  const [referencePoint, setReferencePoint] = useState("");

  const whatsappNumber = useMemo(() => {
    const envNumber = process.env.NEXT_PUBLIC_WHATSAPP_REPORT_NUMBER?.trim() || DEFAULT_WHATSAPP_NUMBER;
    return sanitizeWhatsAppNumber(envNumber);
  }, []);

  const canOpenWhatsApp = Boolean(neighborhood.trim() && referencePoint.trim() && whatsappNumber);

  const whatsappUrl = useMemo(() => {
    const text = buildReportMessage(neighborhood, referencePoint);
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  }, [neighborhood, referencePoint, whatsappNumber]);

  const handleOpenWhatsApp = () => {
    if (!canOpenWhatsApp) {
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
    setNeighborhood("");
    setReferencePoint("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 bg-green-500 hover:bg-green-600 text-white rounded-full px-5 py-3 shadow-lg items-center gap-2 font-semibold transition z-40"
      >
        <Send size={18} />
        Envie seu flagrante
      </button>

      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-5 right-5 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center z-40"
        aria-label="Enviar flagrante"
      >
        <Send size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Envie seu flagrante</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Encaminhamento para WhatsApp da equipe</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Bairro / localidade</label>
              <select
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white"
              >
                <option value="">Selecione o bairro ou distrito</option>
                {NEIGHBORHOOD_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Ponto de referencia</label>
              <input
                type="text"
                value={referencePoint}
                onChange={(event) => setReferencePoint(event.target.value)}
                placeholder="Ex.: proximo a feira, ao lado da escola..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white"
              />

              <button
                onClick={handleOpenWhatsApp}
                disabled={!canOpenWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2.5 font-semibold disabled:opacity-50"
              >
                Abrir WhatsApp
              </button>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Observacao: anexe o video e a foto pelo proprio WhatsApp antes de enviar.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
