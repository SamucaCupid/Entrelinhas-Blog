import Link from "next/link";
import type { PostUI } from "@/types";
import { getCategories, getPosts } from "@/lib/wp";
import { getTemperature } from "@/lib/weather";
import { SiteHeader } from "@/components/app/SiteHeader";
import { MoreNewsWidget, NewsletterBox, SidebarWidget } from "@/components/app/Widgets";
import { ChatWidget } from "@/components/app/ChatWidget";
import { NewsletterSignup } from "@/components/app/NewsletterSignup";

export const revalidate = 60;

function FeaturedHero({ post }: { post: PostUI }) {
  return (
    <Link href={`/post/${post.slug}`} className="relative rounded-2xl overflow-hidden shadow-sm h-full min-h-[320px] lg:min-h-[360px] group cursor-pointer block">
      <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-3">{post.categoryName}</span>
        <h2 className="text-white text-2xl lg:text-3xl font-extrabold tracking-tight mb-2 leading-tight">{post.title}</h2>
        <p className="text-zinc-200 text-sm">{post.excerpt}</p>
      </div>
    </Link>
  );
}

function SmallPostCard({ post }: { post: PostUI }) {
  return (
    <Link
      href={`/post/${post.slug}`}
      className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer block"
    >
      <div className="relative h-32">
        <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{post.categoryName}</span>
      </div>
      <div className="p-4">
        <h3 className="text-zinc-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 font-bold text-sm leading-tight mb-1 transition">
          {post.title}
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs line-clamp-2">{post.excerpt}</p>
      </div>
    </Link>
  );
}

function DesktopHomeLayout({ posts }: { posts: PostUI[] }) {
  if (!posts.length) {
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
  const urgentPost = posts.find((post) => post.categorySlug === "urgente") ?? heroPost;

  return (
    <div className="hidden md:block bg-zinc-50 dark:bg-slate-900 min-h-screen transition-colors">
      <main className="max-w-7xl mx-auto px-6 py-8 md:pb-24 lg:pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-full">
                <FeaturedHero post={heroPost} />
              </div>
              <div className="space-y-4">
                {sidePosts.map((post) => (
                  <SmallPostCard key={post.id} post={post} />
                ))}
              </div>
            </div>

            <Link
              href={`/post/${urgentPost.slug}`}
              className="bg-white border-zinc-200 dark:bg-slate-800 dark:border-slate-700 border rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all block"
            >
              <img src={urgentPost.featuredImageUrl} alt={urgentPost.title} className="w-full h-72 lg:h-96 object-cover" />
              <div className="p-6">
                <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-3">URGENTE</span>
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4 leading-tight">{urgentPost.title}</h1>
                <p className="text-zinc-700 dark:text-zinc-300 text-base lg:text-lg mb-6 leading-relaxed">{urgentPost.excerpt}</p>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  O novo sistema de onibus e resultado de estudos detalhados que avaliaram os principais corredores de trafego da cidade. Com a
                  implementacao das novas rotas, espera-se que milhares de usuarios do transporte publico se beneficiem diretamente desta mudanca.
                </p>
              </div>
            </Link>
          </div>

          <div className="xl:col-span-1">
            <SidebarWidget />
            <MoreNewsWidget posts={posts} />
            <NewsletterBox />
          </div>
        </div>
      </main>

    </div>
  );
}

function MobileHero({ post }: { post: PostUI }) {
  return (
    <Link href={`/post/${post.slug}`} className="relative rounded-2xl overflow-hidden shadow-lg mb-6 mx-4 cursor-pointer block">
      <img src={post.featuredImageUrl} alt={post.title} className="w-full h-64 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-3">{post.categoryName}</span>
        <h2 className="text-white text-2xl font-extrabold tracking-tight leading-tight">{post.title}</h2>
      </div>
    </Link>
  );
}

function MobileFeedCard({ post }: { post: PostUI }) {
  return (
    <Link
      href={`/post/${post.slug}`}
      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm flex gap-3 hover:shadow-md transition cursor-pointer text-left w-full"
    >
      <img src={post.featuredImageUrl} alt={post.title} className="w-24 h-24 object-cover flex-shrink-0" />
      <div className="flex-1 py-2 pr-3">
        <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase mb-1.5">{post.categoryName}</span>
        <h3 className="text-zinc-900 dark:text-white font-bold text-sm leading-tight">{post.title}</h3>
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

function MobileNewsletterCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm mx-4 mb-6">
      <h3 className="text-zinc-900 dark:text-white font-extrabold text-lg mb-2">Newsletter Local</h3>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Receba o resumo do Entrelinhas no seu email</p>

      <NewsletterSignup variant="mobile" />
    </div>
  );
}

function MobileHomeLayout({ posts }: { posts: PostUI[] }) {
  if (!posts.length) {
    return (
    <div className="md:hidden bg-slate-900 dark:bg-slate-950 min-h-screen pb-6">
      <div className="px-4 pt-6 text-zinc-300 text-center">Nenhuma noticia disponivel.</div>
    </div>
  );
  }

  return (
    <div className="md:hidden bg-zinc-50 dark:bg-slate-950 min-h-screen pb-24 pt-4">
      <MobileSocialBar />
      <MobileHero post={posts[0]} />

      <div className="px-4">
        <h2 className="text-yellow-400 font-extrabold text-2xl tracking-tight mb-4">FEED SUDOESTE</h2>
        <div className="space-y-3">
          {posts.slice(1).map((post) => (
            <MobileFeedCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <MobileNewsletterCard />
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [posts, categories, temperature] = await Promise.all([getPosts(12), getCategories(), getTemperature()]);

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={posts} />
      <DesktopHomeLayout posts={posts} />
      <MobileHomeLayout posts={posts} />
      <ChatWidget categories={categories} />
    </div>
  );
}
