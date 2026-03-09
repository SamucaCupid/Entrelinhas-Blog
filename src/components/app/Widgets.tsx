import Link from "next/link";
import type { CityEventUI, PostUI } from "@/types";

type SidebarWidgetProps = {
  eventPosts?: PostUI[];
  cityEvents?: CityEventUI[];
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200";

export function SidebarWidget({ eventPosts = [], cityEvents = [] }: SidebarWidgetProps) {
  const visibleCityEvents = cityEvents.slice(0, 2);
  const visibleWordPressEvents = eventPosts.slice(0, 2);

  return (
    <div className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl p-6 shadow-sm mb-6 transition-colors">
      <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg mb-4 flex items-center gap-2">
        Eventos em Vitoria da Conquista
        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">PROXIMOS</span>
      </h3>

      {visibleCityEvents.length > 0 ? (
        <div className="space-y-4">
          {visibleCityEvents.map((event, index) => (
            <a
              key={event.id}
              href={event.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex gap-3 ${index < visibleCityEvents.length - 1 ? "pb-4 border-b border-zinc-100 dark:border-slate-700" : ""}`}
            >
              <img src={event.imageUrl || FALLBACK_IMAGE} alt={event.title} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 line-clamp-2">{event.title}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{event.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      ) : visibleWordPressEvents.length > 0 ? (
        <div className="space-y-4">
          {visibleWordPressEvents.map((eventPost, index) => (
            <Link
              key={eventPost.id}
              href={`/post/${eventPost.slug}`}
              className={`flex gap-3 ${index < visibleWordPressEvents.length - 1 ? "pb-4 border-b border-zinc-100 dark:border-slate-700" : ""}`}
            >
              <img src={eventPost.featuredImageUrl || FALLBACK_IMAGE} alt={eventPost.title} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 line-clamp-2">{eventPost.title}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{eventPost.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Nenhum evento publicado no momento.</p>
      )}
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
