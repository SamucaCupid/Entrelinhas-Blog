import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostPage } from "@/components/app/PostPage";
import { MobilePostPage } from "@/components/app/MobilePostPage";
import { SiteHeader } from "@/components/app/SiteHeader";
import { getCategories, getPostBySlug, getPosts } from "@/lib/wp";
import { getSiteName, postDescription } from "@/lib/seo";
import { getTemperature } from "@/lib/weather";

export const revalidate = 60;

type PostRouteProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const posts = await getPosts(50, { revalidate: 60 });
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostRouteProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug, { revalidate: 60 });
  const canonicalPath = `/post/${params.slug}`;
  const siteName = getSiteName();

  if (!post) {
    return {
      title: "Noticia nao encontrada",
      description: "A noticia solicitada nao foi encontrada.",
      alternates: { canonical: canonicalPath },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = postDescription(post);
  const publishedDate = new Date(post.date);
  const publishedIso = Number.isNaN(publishedDate.getTime()) ? undefined : publishedDate.toISOString();
  const images = post.featuredImageUrl
    ? [
        {
          url: post.featuredImageUrl,
          alt: post.title,
        },
      ]
    : undefined;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: `/post/${post.slug}`,
    },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      siteName,
      title: post.title,
      description,
      url: `/post/${post.slug}`,
      publishedTime: publishedIso,
      section: post.categoryName || undefined,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: images?.map((image) => image.url),
    },
  };
}

export default async function PostRoute({ params }: PostRouteProps) {
  const [post, posts, categories, temperature] = await Promise.all([
    getPostBySlug(params.slug, { revalidate: 60 }),
    getPosts(12, { revalidate: 60 }),
    getCategories({ revalidate: 120 }),
    getTemperature(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={posts} />
      <PostPage post={post} posts={posts} />
      <MobilePostPage post={post} />
    </div>
  );
}
