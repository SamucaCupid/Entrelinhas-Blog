import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PostUI } from "@/types";

type MobilePostPageProps = {
  post: PostUI;
};

export function MobilePostPage({ post }: MobilePostPageProps) {
  return (
    <div className="md:hidden bg-white dark:bg-slate-900 min-h-screen transition-colors">
      <div className="px-4 pt-4 pb-6">
        <Link href="/" className="flex items-center gap-2 mb-4 text-zinc-700 dark:text-yellow-400 font-semibold">
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-3">{post.categoryName}</span>

        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3 leading-tight">{post.title}</h1>

        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          {new Date(post.date).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        {post.featuredImageUrl && <img src={post.featuredImageUrl} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-6" />}

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="lead">{post.excerpt}</p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </div>
    </div>
  );
}
