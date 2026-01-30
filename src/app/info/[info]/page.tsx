import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/app/SiteHeader";
import { getCategories, getPosts } from "@/lib/wp";
import { getTemperature } from "@/lib/weather";

export const revalidate = 60;

const CONTENT = {
  sobre: {
    title: "Sobre o Entrelinhas",
    body: [
      "O Entrelinhas e um portal de noticias de Vitoria da Conquista e regiao.",
      "Nosso foco e informar com agilidade, responsabilidade e proximidade com a comunidade.",
    ],
  },
  equipe: {
    title: "Nossa Equipe",
    body: ["Maria Silva - Redacao", "Joao Santos - Reporter", "Ana Costa - Editora"],
  },
  contato: {
    title: "Entre em Contato",
    body: ["Email: contato@entrelinhas.com.br", "Telefone: (77) 3424-0000", "Endereco: Vitoria da Conquista - BA"],
  },
  termos: {
    title: "Termos de Uso",
    body: [
      "O conteudo publicado e de responsabilidade do Entrelinhas.",
      "Reproducao permitida com citacao da fonte.",
      "Reservamos o direito de atualizar estes termos a qualquer momento.",
    ],
  },
};

type InfoKey = keyof typeof CONTENT;

type InfoRouteProps = {
  params: { info: string };
};

export async function generateStaticParams() {
  return Object.keys(CONTENT).map((info) => ({ info }));
}

export default async function InfoRoute({ params }: InfoRouteProps) {
  const info = params.info as InfoKey;
  const data = CONTENT[info];

  if (!data) {
    notFound();
  }

  const [categories, temperature, searchPosts] = await Promise.all([getCategories(), getTemperature(), getPosts(12)]);

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={searchPosts} />

      <div className="min-h-screen bg-zinc-50 dark:bg-slate-900 transition-colors">
        <main className="max-w-3xl mx-auto px-6 py-10">
          <Link href="/" className="flex items-center gap-2 mb-6 text-zinc-700 dark:text-zinc-300 hover:text-yellow-600 dark:hover:text-yellow-400 font-semibold transition">
            <ArrowLeft size={20} />
            Voltar
          </Link>
          <div className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl p-6 shadow-sm">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">{data.title}</h1>
            <div className="text-zinc-700 dark:text-zinc-300 space-y-3 text-sm leading-relaxed">
              {data.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
