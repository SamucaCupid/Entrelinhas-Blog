import Link from "next/link";
import Image from "next/image";
import type { Category, PostUI } from "@/types";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { MenuAction, SearchAction } from "@/components/app/HeaderActions";

type SiteHeaderProps = {
  categories: Category[];
  temperature: string;
  searchPosts?: PostUI[];
};

function formatDate(value: Date) {
  const formatted = value.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function SiteHeader({ categories, temperature, searchPosts = [] }: SiteHeaderProps) {
  const dateTime = formatDate(new Date());

  return (
    <>
      <div className="hidden md:block bg-slate-800 text-white dark:bg-slate-900 py-2 px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs lg:text-sm">
          <span>
            {dateTime} - Vitoria da Conquista, {temperature}
          </span>
          <div className="flex gap-4 items-center">
            <SearchAction posts={searchPosts} className="hover:text-yellow-400 transition" iconSize={18} />
            <ThemeToggle className="hover:text-yellow-400 transition" />
          </div>
        </div>
      </div>

      <header className="hidden md:block bg-white border-zinc-200 dark:bg-slate-900 dark:border-slate-700 border-b py-4 px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition">
            <Image src="/entrelinhas-logo-dark.png" alt="Entrelinhas" width={180} height={48} className="h-10 w-auto dark:hidden" priority />
            <Image src="/entrelinhas-logo.png" alt="Entrelinhas" width={180} height={48} className="h-10 w-auto hidden dark:block" priority />
          </Link>

          <nav className="flex items-center gap-3 text-xs lg:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="hidden 2xl:flex items-center gap-4 lg:gap-8">
              {categories.map((cat) => (
                <Link key={cat.slug} href={`/categoria/${cat.slug}`} className="hover:text-yellow-500 transition">
                  {cat.name}
                </Link>
              ))}
            </div>
            <MenuAction className="cursor-pointer hover:text-yellow-500 transition" iconSize={20} categories={categories} />
          </nav>
        </div>
      </header>

      <header className="md:hidden bg-white text-zinc-900 dark:bg-slate-900 dark:text-white border-b border-zinc-200 dark:border-slate-800 py-4 px-4 sticky top-0 z-50 transition-colors">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition">
            <Image src="/entrelinhas-logo-dark.png" alt="Entrelinhas" width={150} height={40} className="h-9 w-auto dark:hidden" priority />
            <Image src="/entrelinhas-logo.png" alt="Entrelinhas" width={150} height={40} className="h-9 w-auto hidden dark:block" priority />
          </Link>

          <div className="flex items-center gap-2">
            <SearchAction posts={searchPosts} className="p-2" iconSize={20} />
            <ThemeToggle className="p-2" />
            <MenuAction className="p-2" iconSize={22} categories={categories} />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          {dateTime} · Vitoria da Conquista · {temperature}
        </div>
      </header>

      <nav className="hidden" aria-hidden="true" />
    </>
  );
}
