import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/app/CategoryPage";
import { MobileCategoryPage } from "@/components/app/MobileCategoryPage";
import { SiteHeader } from "@/components/app/SiteHeader";
import { NewsletterBox, SidebarWidget } from "@/components/app/Widgets";
import { getCategories, getPosts, getPostsByCategory } from "@/lib/wp";
import { getTemperature } from "@/lib/weather";

export const revalidate = 60;

type CategoryRouteProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const [posts, categories, temperature, searchPosts] = await Promise.all([
    getPostsByCategory(params.slug),
    getCategories(),
    getTemperature(),
    getPosts(12),
  ]);
  const category = categories.find((item) => item.slug === params.slug);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={searchPosts} />
      <CategoryPage
        categorySlug={params.slug}
        posts={posts}
        categoryName={category.name}
        sidebar={
          <>
            <SidebarWidget />
            <NewsletterBox />
          </>
        }
      />
      <MobileCategoryPage categorySlug={params.slug} posts={posts} categoryName={category.name} />
    </div>
  );
}
