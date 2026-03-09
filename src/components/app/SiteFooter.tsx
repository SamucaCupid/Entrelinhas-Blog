import Image from "next/image";
import Link from "next/link";

const EDITORIAL_LINKS = [
  { name: "Politica", href: "/categoria/politica" },
  { name: "Policia", href: "/categoria/policia" },
  { name: "Eventos", href: "/categoria/eventos" },
  { name: "Negocios", href: "/categoria/negocios" },
  { name: "Cultura", href: "/categoria/cultura" },
];

const INSTITUTIONAL_LINKS = [
  { name: "Sobre o Entrelinhas", href: "/info/sobre" },
  { name: "Nossa equipe", href: "/info/equipe" },
  { name: "Contato", href: "/info/contato" },
  { name: "Termos de uso", href: "/info/termos" },
];

const DEFAULT_WHATSAPP_NUMBER = "5577988397862";

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

function getWhatsappHref(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_REPORT_NUMBER?.trim() || DEFAULT_WHATSAPP_NUMBER;
  const number = sanitizePhone(raw);
  const message = "Ola, gostaria de enviar um flagrante para analise editorial.";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const whatsappHref = getWhatsappHref();

  return (
    <footer className="bg-slate-900 text-zinc-200 dark:bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="inline-flex items-center hover:opacity-80 transition">
              <Image src="/entrelinhas-logo.png" alt="Entrelinhas" width={190} height={50} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 max-w-sm">
              Jornalismo local com foco em Vitoria da Conquista e regiao, com atualizacao continua via WordPress.com.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300 mb-4">Editorias</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              {EDITORIAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-yellow-400 transition">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300 mb-4">Institucional</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              {INSTITUTIONAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-yellow-400 transition">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300 mb-4">Contato rapido</h3>
            <div className="space-y-3 text-sm text-zinc-400">
              <p>E-mail: contato@entrelinhas.com.br</p>
              <p>WhatsApp: (77) 98839-7862</p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 transition"
              >
                Enviar flagrante
              </a>
              <p className="text-xs text-zinc-500">Envio sujeito a validacao editorial antes de publicacao.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-500">
          <p>© {currentYear} Entrelinhas. Todos os direitos reservados.</p>
          <p>Atualizacao automatica: posts em ate 60s e categorias em ate 120s.</p>
        </div>
      </div>
    </footer>
  );
}

