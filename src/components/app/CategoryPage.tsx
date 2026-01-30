import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { PostUI } from "@/types";

type CategoryPageProps = {
  categorySlug: string;
  posts: PostUI[];
  categoryName?: string;
  sidebar?: ReactNode;
};

export function CategoryPage({ categorySlug, posts, categoryName, sidebar }: CategoryPageProps) {
  const categoryPosts = posts.filter((post) => post.categorySlug === categorySlug);
  const title = categoryName ?? categorySlug;

  return (
    <div className="hidden md:block bg-zinc-50 dark:bg-slate-900 min-h-screen transition-colors">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center gap-2 mb-6 text-zinc-700 dark:text-zinc-300 hover:text-yellow-600 dark:hover:text-yellow-400 font-semibold transition">
          <ArrowLeft size={20} />
          Voltar para Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">{title}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{categoryPosts.length} noticias encontradas</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categoryPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative h-48">
                    <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-5">
                    <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-3">{post.categoryName}</span>
                    <h3 className="text-zinc-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 font-bold text-lg leading-tight mb-2 transition">
                      {post.title}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="xl:col-span-1 mt-8 xl:mt-0">{sidebar}</div>
        </div>
      </main>
    </div>
  );
}
