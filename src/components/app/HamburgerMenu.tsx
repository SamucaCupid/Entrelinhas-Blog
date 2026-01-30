"use client";

import Link from "next/link";
import type { Category } from "@/types";

type HamburgerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
};

const MENU_ITEMS = [
  { key: "sobre" as const, title: "Sobre o Entrelinhas", description: "Conheca nossa historia e missao" },
  { key: "equipe" as const, title: "Nossa Equipe", description: "Jornalistas: Maria Silva, Joao Santos, Ana Costa" },
  { key: "contato" as const, title: "Entre em Contato", description: "contato@entrelinhas.com.br | (77) 3424-0000" },
  { key: "termos" as const, title: "Termos de Uso", description: "Politicas e diretrizes do portal" },
];

export function HamburgerMenu({ isOpen, onClose, categories = [] }: HamburgerMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 px-4 pb-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[calc(100vh-5rem)] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Menu</h2>
          <button onClick={onClose} className="text-3xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
            &times;
          </button>
        </div>

        {categories.length > 0 && (
          <div className="space-y-3 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Categorias</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categoria/${category.slug}`}
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-slate-700 hover:bg-zinc-100 dark:hover:bg-slate-600 transition"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={`/info/${item.key}`}
              onClick={onClose}
              className="w-full text-left p-4 rounded-xl transition hover:bg-zinc-50 dark:hover:bg-slate-700 border border-zinc-200 dark:border-slate-700 block"
            >
              <h3 className="font-bold mb-1 text-zinc-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-slate-700">
          <div className="flex gap-4 justify-center">
            <a href="#" className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 transition">
              <svg className="w-4 h-4 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 transition">
              <svg className="w-5 h-5 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2m-.2 2C5.4 4 4 5.4 4 7.6v8.8c0 2.2 1.4 3.6 3.6 3.6h8.8c2.2 0 3.6-1.4 3.6-3.6V7.6C20 5.4 18.6 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 011.25 1.25A1.25 1.25 0 0117.25 8 1.25 1.25 0 0116 6.75a1.25 1.25 0 011.25-1.25M12 7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5m0 2c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
