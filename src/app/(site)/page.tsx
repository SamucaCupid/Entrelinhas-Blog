import Link from "next/link";
import type { PostUI } from "@/types";
import { getCategories, getPosts, getPostsByCategory } from "@/lib/wp";
import { getTemperature } from "@/lib/weather";
import { getCityEvents } from "@/lib/city-events";
import { AdSlot } from "@/components/app/AdSlot";
import { SiteHeader } from "@/components/app/SiteHeader";
import { MoreNewsWidget, SidebarWidget } from "@/components/app/Widgets";
import { ChatWidget } from "@/components/app/ChatWidget";

export const revalidate = 60;

function UrgentHeadline({ post }: { post: PostUI }) {
  const normalizedCategorySlug = post.categorySlug?.trim().toLowerCase();
  const contextCategory = post.categoryName?.trim();
  const hasContextCategory = Boolean(
    contextCategory &&
      normalizedCategorySlug &&
      normalizedCategorySlug !== "urgente" &&
      normalizedCategorySlug !== "uncategorized" &&
      normalizedCategorySlug !== "sem-categoria"
  );

  return (
    <Link
      href={`/post/${post.slug}`}
      className="relative rounded-2xl overflow-hidden shadow-sm min-h-[360px] md:min-h-[520px] lg:min-h-[420px] group cursor-pointer block"
    >
      <img src={post.featuredImageUrl} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">URGENTE</span>
          {hasContextCategory && (
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">{contextCategory}</span>
          )}
        </div>
        <h1 className="text-white text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{post.title}</h1>
        <p className="text-zinc-200 text-base lg:text-lg leading-relaxed line-clamp-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{post.excerpt}</p>
      </div>
    </Link>
  );
}

function FeaturedHero({ post }: { post: PostUI }) {
  return (
    <Link href={`/post/${post.slug}`} className="relative rounded-2xl overflow-hidden shadow-sm min-h-[220px] lg:min-h-[360px] group cursor-pointer block">
      <img src={post.featuredImageUrl} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-3">{post.categoryName}</span>
        <h2 className="text-white text-2xl lg:text-3xl font-extrabold tracking-tight mb-2 leading-tight line-clamp-3">{post.title}</h2>
        <p className="text-zinc-200 text-sm line-clamp-2">{post.excerpt}</p>
      </div>
    </Link>
  );
}

function SmallPostCard({ post, stretchAt1200 = false }: { post: PostUI; stretchAt1200?: boolean }) {
  return (
    <Link
      href={`/post/${post.slug}`}
      className={`relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer block ${
        stretchAt1200 ? "h-full min-[1200px]:min-h-[320px]" : "min-h-[220px] lg:min-h-[190px]"
      }`}
    >
      <img src={post.featuredImageUrl} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-3">{post.categoryName}</span>
        <h3 className={`text-white font-extrabold tracking-tight mb-2 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${stretchAt1200 ? "text-2xl" : "text-lg"}`}>
          {post.title}
        </h3>
        <p className={`text-zinc-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${stretchAt1200 ? "text-sm line-clamp-3" : "text-xs line-clamp-2"}`}>{post.excerpt}</p>
      </div>
    </Link>
  );
}

function DesktopHomeLayout({
  posts,
  eventPosts,
  cityEvents,
  urgentPost,
}: {
  posts: PostUI[];
  eventPosts: PostUI[];
  cityEvents: Awaited<ReturnType<typeof getCityEvents>>;
  urgentPost: PostUI | null;
}) {
  if (!urgentPost && !posts.length) {
    return (
      <div className="hidden md:block bg-zinc-50 dark:bg-slate-900 min-h-screen">
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white border border-zinc-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl p-10 text-center text-zinc-600 dark:text-zinc-300">
            Nenhuma noticia disponivel.
          </div>
        </main>
      </div>
    );
  }

  const heroPost = posts[0];
  const sidePosts = posts.slice(1, 3);
  const shouldStretchSingleSidePost = sidePosts.length === 1;

  return (
    <div className="hidden md:block bg-zinc-50 dark:bg-slate-900 min-h-screen transition-colors">
      <main className="max-w-7xl mx-auto px-6 py-8 md:pb-24 space-y-6">
        {urgentPost && <UrgentHeadline post={urgentPost} />}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-full">
                  <FeaturedHero post={heroPost} />
                </div>
                <div className={shouldStretchSingleSidePost ? "h-full" : "space-y-4"}>
                  {sidePosts.map((post) => (
                    <SmallPostCard key={post.id} post={post} stretchAt1200={shouldStretchSingleSidePost} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 dark:bg-slate-800 dark:border-slate-700 rounded-2xl p-10 text-center text-zinc-600 dark:text-zinc-300">
                Sem novas noticias no feed no momento.
              </div>
            )}
          </div>

          <div className="xl:col-span-1">
            <AdSlot slot="sidebar-home" className="mb-6" />
            <SidebarWidget eventPosts={eventPosts} cityEvents={cityEvents} />
            <MoreNewsWidget posts={posts} />
          </div>
        </div>
      </main>

    </div>
  );
}

function MobileHero({ post, isUrgent = false }: { post: PostUI; isUrgent?: boolean }) {
  const normalizedCategorySlug = post.categorySlug?.trim().toLowerCase();
  const showContextCategory = Boolean(
    post.categoryName &&
      normalizedCategorySlug &&
      normalizedCategorySlug !== "urgente" &&
      normalizedCategorySlug !== "uncategorized" &&
      normalizedCategorySlug !== "sem-categoria"
  );

  return (
    <Link href={`/post/${post.slug}`} className="relative rounded-2xl overflow-hidden shadow-lg mb-6 mx-4 cursor-pointer block">
      <img src={post.featuredImageUrl} alt={post.title} className="w-full h-64 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {isUrgent && <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">URGENTE</span>}
          {isUrgent && showContextCategory && (
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">{post.categoryName}</span>
          )}
          {!isUrgent && (
            <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">{post.categoryName}</span>
          )}
        </div>
        <h2 className="text-white text-2xl font-extrabold tracking-tight leading-tight">{post.title}</h2>
      </div>
    </Link>
  );
}

function MobileFeedCard({ post }: { post: PostUI }) {
  return (
    <Link
      href={`/post/${post.slug}`}
      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm flex items-stretch gap-3 hover:shadow-md transition cursor-pointer text-left w-full min-h-[112px]"
    >
      <img src={post.featuredImageUrl} alt={post.title} className="w-24 self-stretch object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0 py-2.5 pr-3">
        <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase mb-1.5">{post.categoryName}</span>
        <h3 className="text-zinc-900 dark:text-white font-bold text-sm leading-tight line-clamp-3">{post.title}</h3>
      </div>
    </Link>
  );
}

function MobileSocialBar() {
  return (
    <div className="hidden sm:flex fixed left-2 top-1/2 -translate-y-1/2 flex-col gap-4 z-40">
      <a href="#" className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-400 transition">
        <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a href="#" className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-400 transition">
        <svg className="w-5 h-5 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </a>
      <a href="#" className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-400 transition">
        <svg className="w-5 h-5 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2m-.2 2C5.4 4 4 5.4 4 7.6v8.8c0 2.2 1.4 3.6 3.6 3.6h8.8c2.2 0 3.6-1.4 3.6-3.6V7.6C20 5.4 18.6 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 011.25 1.25A1.25 1.25 0 0117.25 8 1.25 1.25 0 0116 6.75a1.25 1.25 0 011.25-1.25M12 7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5m0 2c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" />
        </svg>
      </a>
    </div>
  );
}

function MobileHomeLayout({ posts, urgentPost }: { posts: PostUI[]; urgentPost: PostUI | null }) {
  const mainHeroPost = urgentPost ?? posts[0];
  const feedPosts = urgentPost ? posts : posts.slice(1);
  const mainHeroIsUrgent = Boolean(urgentPost && mainHeroPost && urgentPost.id === mainHeroPost.id);

  if (!mainHeroPost && !feedPosts.length) {
    return (
      <div className="md:hidden bg-slate-900 dark:bg-slate-950 min-h-screen pb-6">
        <div className="px-4 pt-6 text-zinc-300 text-center">Nenhuma noticia disponivel.</div>
      </div>
    );
  }

  return (
      <div className="md:hidden bg-zinc-50 dark:bg-slate-950 min-h-screen pb-24 pt-4">
      <MobileSocialBar />
      {mainHeroPost && <MobileHero post={mainHeroPost} isUrgent={mainHeroIsUrgent} />}

      <div className="px-4">
        <div className="space-y-3">
          {feedPosts.map((post, index) => (
            <div key={post.id} className="space-y-3">
              <MobileFeedCard post={post} />
              {index === 1 && <AdSlot slot="mobile-feed" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [posts, categories, temperature, eventPosts, cityEvents, urgentPosts] = await Promise.all([
    getPosts(12, { revalidate: 60 }),
    getCategories({ revalidate: 120 }),
    getTemperature(),
    getPostsByCategory("eventos", { revalidate: 120 }),
    getCityEvents(6),
    getPostsByCategory("urgente", { revalidate: 60 }),
  ]);
  const urgentPost = urgentPosts[0] ?? null;
  const feedPosts = urgentPost ? posts.filter((post) => post.id !== urgentPost.id) : posts;
  const searchPosts = urgentPost ? [urgentPost, ...feedPosts] : feedPosts;

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={searchPosts} />
      <DesktopHomeLayout posts={feedPosts} eventPosts={eventPosts} cityEvents={cityEvents} urgentPost={urgentPost} />
      <MobileHomeLayout posts={feedPosts} urgentPost={urgentPost} />
      <ChatWidget categories={categories} />
    </div>
  );
}
