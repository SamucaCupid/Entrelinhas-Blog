import Link from "next/link";
import type { PostUI } from "@/types";
import { NewsletterSignup } from "@/components/app/NewsletterSignup";

export function SidebarWidget() {
  return (
    <div className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl p-6 shadow-sm mb-6 transition-colors">
      <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg mb-4 flex items-center gap-2">
        Widget de Eventos
        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">HOJE</span>
      </h3>

      <div className="space-y-4">
        <div className="flex gap-3 pb-4 border-b border-zinc-100 dark:border-slate-700">
          <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200" alt="Evento" className="w-20 h-20 object-cover rounded-lg" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Revirada ao Bosque</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Musica livre promove discussao para todos.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200" alt="Evento" className="w-20 h-20 object-cover rounded-lg" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Fla tudo the Mbeweli</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Havera tudo domesticos almendros presa lugares.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type MoreNewsWidgetProps = {
  posts: PostUI[];
};

export function MoreNewsWidget({ posts }: MoreNewsWidgetProps) {
  return (
    <div className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl p-6 shadow-sm mb-6 transition-colors">
      <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg mb-4">Mais Noticias do Entrelinhas</h3>

      <div className="grid grid-cols-2 gap-3">
        {posts.slice(0, 4).map((post) => (
          <Link key={post.id} href={`/post/${post.slug}`} className="group cursor-pointer text-left">
            <img src={post.featuredImageUrl} alt={post.title} className="w-full h-24 object-cover rounded-lg mb-2 group-hover:opacity-80 transition" />
            <h4 className="text-zinc-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 text-xs font-bold leading-tight transition">
              {post.title.substring(0, 50)}...
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function NewsletterBox() {
  return (
    <div className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl p-6 shadow-sm transition-colors">
      <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg mb-2">Newsletter Local</h3>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Receba o resumo do Entrelinhas no seu email</p>

      <NewsletterSignup />
    </div>
  );
}
