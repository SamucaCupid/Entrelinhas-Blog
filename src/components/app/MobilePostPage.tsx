import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdSlot } from "@/components/app/AdSlot";
import type { PostUI } from "@/types";

type MobilePostPageProps = {
  post: PostUI;
};

export function MobilePostPage({ post }: MobilePostPageProps) {
  const contentHtml = post.content?.trim() ? post.content : `<p>${post.excerpt}</p>`;

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

        <div className="prose prose-zinc dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />

        <AdSlot slot="mobile-feed" categorySlug={post.categorySlug} className="mt-6" />
      </div>
    </div>
  );
}
