import Link from "next/link";
import { SiteHeader } from "@/components/app/SiteHeader";
import { getCategories, getPosts } from "@/lib/wp";
import { getTemperature } from "@/lib/weather";

export const revalidate = 60;

type SearchPageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const [posts, categories, temperature] = await Promise.all([getPosts(undefined, { revalidate: 60 }), getCategories({ revalidate: 120 }), getTemperature()]);
  const results = query
    ? posts.filter((post) => {
        const term = query.toLowerCase();
        return (
          post.title.toLowerCase().includes(term) ||
          post.excerpt.toLowerCase().includes(term) ||
          post.categoryName?.toLowerCase().includes(term)
        );
      })
    : [];

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={posts} />

      <div className="min-h-screen bg-zinc-50 dark:bg-slate-900 transition-colors">
        <main className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">Buscar noticias</h1>

          <form method="get" className="flex gap-2 mb-8">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Digite sua busca"
              className="flex-1 px-4 py-3 border border-zinc-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button className="bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold px-6 py-3 rounded-lg transition">Buscar</button>
          </form>

          {query && results.length === 0 && <p className="text-zinc-600 dark:text-zinc-400">Nenhum resultado encontrado para "{query}".</p>}

          {!query && <p className="text-zinc-500 dark:text-zinc-400">Digite um termo para iniciar a busca.</p>}

          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="bg-white border border-zinc-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <img src={post.featuredImageUrl} alt={post.title} className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-3">{post.categoryName}</span>
                    <h3 className="text-zinc-900 dark:text-white font-bold text-lg leading-tight mb-2">{post.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
