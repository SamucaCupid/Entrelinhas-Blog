import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/app/AdSlot";
import type { PostUI } from "@/types";

type PostPageProps = {
  post: PostUI;
  posts: PostUI[];
  aside?: ReactNode;
};

export function PostPage({ post, posts, aside }: PostPageProps) {
  const relatedPosts = posts.filter((item) => item.id !== post.id).slice(0, 4);
  const contentHtml = post.content?.trim() ? post.content : `<p>${post.excerpt}</p>`;

  return (
    <div className="hidden md:block bg-zinc-50 dark:bg-slate-900 min-h-screen transition-colors">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center gap-2 mb-6 text-zinc-700 dark:text-zinc-300 hover:text-yellow-600 dark:hover:text-yellow-400 font-semibold transition">
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <article className="xl:col-span-2">
            <div className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl overflow-hidden shadow-sm p-6 lg:p-8">
              <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-4">{post.categoryName}</span>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4 leading-tight">{post.title}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                Publicado em{" "}
                {new Date(post.date).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>

              {post.featuredImageUrl && <img src={post.featuredImageUrl} alt={post.title} className="w-full h-72 lg:h-96 object-cover rounded-xl mb-6" />}

              <div className="prose prose-zinc dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </div>
          </article>

          <aside className="xl:col-span-1 mt-8 xl:mt-0">
            <AdSlot slot="sidebar-post" categorySlug={post.categorySlug} className="mb-6" />
            <div className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg mb-4">Leia tambem</h3>
              <div className="space-y-4">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/post/${relatedPost.slug}`}
                    className="group cursor-pointer pb-4 border-b border-zinc-200 dark:border-slate-700 last:border-0 last:pb-0"
                  >
                    <h4 className="text-zinc-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 text-sm font-bold leading-tight mb-1 transition">
                      {relatedPost.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{relatedPost.categoryName}</p>
                  </Link>
                ))}
              </div>
            </div>
            {aside}
          </aside>
        </div>
      </main>
    </div>
  );
}
