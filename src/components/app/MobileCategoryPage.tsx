import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PostUI } from "@/types";

type MobileCategoryPageProps = {
  categorySlug: string;
  posts: PostUI[];
  categoryName?: string;
};

export function MobileCategoryPage({ categorySlug, posts, categoryName }: MobileCategoryPageProps) {
  const categoryPosts = posts.filter((post) => post.categorySlug === categorySlug);
  const title = categoryName ?? categorySlug;

  return (
    <div className="md:hidden bg-zinc-50 dark:bg-slate-950 min-h-screen pb-6">
      <div className="px-4 pt-4">
        <Link href="/" className="flex items-center gap-2 mb-4 text-yellow-500 dark:text-yellow-400 font-semibold">
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <h1 className="text-zinc-900 dark:text-white text-3xl font-extrabold tracking-tight mb-2">{title}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">{categoryPosts.length} noticias</p>

        <div className="space-y-3">
          {categoryPosts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.slug}`}
              className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm flex gap-3 hover:shadow-md transition cursor-pointer w-full text-left"
            >
              <img src={post.featuredImageUrl} alt={post.title} className="w-24 h-24 object-cover flex-shrink-0" />
              <div className="flex-1 py-2 pr-3">
                <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase mb-1.5">{post.categoryName}</span>
                <h3 className="text-zinc-900 dark:text-white font-bold text-sm leading-tight">{post.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
