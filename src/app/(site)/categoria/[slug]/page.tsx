import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/app/CategoryPage";
import { MobileCategoryPage } from "@/components/app/MobileCategoryPage";
import { SiteHeader } from "@/components/app/SiteHeader";
import { SidebarWidget } from "@/components/app/Widgets";
import { getCategories, getPosts, getPostsByCategory } from "@/lib/wp";
import { getSiteName, toMetaDescription } from "@/lib/seo";
import { getTemperature } from "@/lib/weather";
import { getCityEvents } from "@/lib/city-events";

export const revalidate = 120;

type CategoryRouteProps = {
  params: { slug: string };
};

function normalizeCategorySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

export async function generateStaticParams() {
  const categories = await getCategories({ revalidate: 120 });
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const normalizedParamSlug = normalizeCategorySlug(params.slug);
  const categories = await getCategories({ revalidate: 120 });
  const category = categories.find((item) => normalizeCategorySlug(item.slug) === normalizedParamSlug);
  const siteName = getSiteName();

  if (!category) {
    return {
      title: "Categoria nao encontrada",
      description: "A categoria solicitada nao foi encontrada.",
      alternates: { canonical: `/categoria/${params.slug}` },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${category.name} - Noticias`;
  const description = toMetaDescription(`Acompanhe as noticias mais recentes da categoria ${category.name} no ${siteName}.`);
  const categoryPath = `/categoria/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: categoryPath,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName,
      title,
      description,
      url: categoryPath,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const normalizedParamSlug = normalizeCategorySlug(params.slug);

  const [posts, categories, temperature, searchPosts, eventPosts, cityEvents] = await Promise.all([
    getPostsByCategory(normalizedParamSlug, { revalidate: 120 }),
    getCategories({ revalidate: 120 }),
    getTemperature(),
    getPosts(12, { revalidate: 60 }),
    getPostsByCategory("eventos", { revalidate: 120 }),
    getCityEvents(6),
  ]);
  const category = categories.find((item) => normalizeCategorySlug(item.slug) === normalizedParamSlug);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <SiteHeader categories={categories} temperature={temperature} searchPosts={searchPosts} />
      <CategoryPage
        posts={posts}
        categoryName={category.name}
        categorySlug={normalizedParamSlug}
        sidebar={
          <SidebarWidget eventPosts={eventPosts} cityEvents={cityEvents} />
        }
      />
      <MobileCategoryPage posts={posts} categoryName={category.name} />
    </div>
  );
}
