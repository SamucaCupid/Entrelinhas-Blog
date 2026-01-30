import { notFound } from "next/navigation";
import { PostPage } from "@/components/app/PostPage";
import { MobilePostPage } from "@/components/app/MobilePostPage";
import { SiteHeader } from "@/components/app/SiteHeader";
import { NewsletterBox } from "@/components/app/Widgets";
import { getCategories, getPostBySlug, getPosts } from "@/lib/wp";
import { getTemperature } from "@/lib/weather";

export const revalidate = 60;

type PostRouteProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const posts = await getPosts(50);
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostRoute({ params }: PostRouteProps) {
  const [post, posts, categories, temperature] = await Promise.all([getPostBySlug(params.slug), getPosts(12), getCategories(), getTemperature()]);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={posts} />
      <PostPage post={post} posts={posts} aside={<NewsletterBox />} />
      <MobilePostPage post={post} />
    </div>
  );
}
