import type { Category, PostUI } from "@/types";

const WP_API = process.env.WORDPRESS_API_URL || "";

const mockPosts: PostUI[] = [
  {
    id: 1,
    slug: "nova-linha-onibus-reduz-tempo",
    title: "Nova linha de onibus reduz tempo de viagem em 30%",
    excerpt:
      "Ultima hora! Nova rota implementada pela prefeitura promete revolucionar o transporte publico da cidade.",
    date: "2024-12-20",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
    categoryName: "URGENTE",
    categorySlug: "urgente",
  },
  {
    id: 2,
    slug: "festival-inverno-primeiras-atracoes",
    title: "Festival de Inverno anuncia primeiras atracoes",
    excerpt: "Evento promete movimentar a economia local com shows nacionais.",
    date: "2024-12-20",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    categoryName: "EVENTOS",
    categorySlug: "eventos",
  },
  {
    id: 3,
    slug: "investimento-milionario-economia-local",
    title: "Investimento milionario aquece economia local",
    excerpt: "Novos empreendimentos trazem expectativa de geracao de empregos.",
    date: "2024-12-20",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    categoryName: "NEGOCIOS",
    categorySlug: "negocios",
  },
  {
    id: 4,
    slug: "operacao-prende-grupo-golpes",
    title: "Operacao prende grupo especializado em golpes",
    excerpt: "Policia Civil desarticula quadrilha que atuava na regiao.",
    date: "2024-12-19",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=400",
    categoryName: "POLICIA",
    categorySlug: "policia",
  },
  {
    id: 5,
    slug: "vereador-anuncia-plano-saneamento",
    title: "Vereador anuncia plano de saneamento basico",
    excerpt: "Proposta visa atender bairros sem cobertura adequada.",
    date: "2024-12-19",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400",
    categoryName: "POLITICA",
    categorySlug: "politica",
  },
  {
    id: 6,
    slug: "conquista-sabor-guia-gastronomico",
    title: "Conquista Sabor: novo guia gastronomico e lancado",
    excerpt: "Publicacao destaca os melhores restaurantes da cidade.",
    date: "2024-12-19",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    categoryName: "CULTURA",
    categorySlug: "cultura",
  },
  {
    id: 7,
    slug: "corrupcao-prefeitura-investigada",
    title: "Esquema de corrupcao na prefeitura e investigado",
    excerpt: "MPF abre inquerito para apurar irregularidades em licitacoes.",
    date: "2024-12-18",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
    categoryName: "POLITICA",
    categorySlug: "politica",
  },
  {
    id: 8,
    slug: "assalto-banco-centro",
    title: "Assalto a banco no centro mobiliza policia",
    excerpt: "Tres suspeitos fugiram levando quantia nao divulgada.",
    date: "2024-12-18",
    content: "Conteudo completo da noticia...",
    featuredImageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400",
    categoryName: "POLICIA",
    categorySlug: "policia",
  },
];

const mockCategories: Category[] = [
  { id: 1, name: "Politica", slug: "politica", count: 2 },
  { id: 2, name: "Policia", slug: "policia", count: 2 },
  { id: 3, name: "Eventos", slug: "eventos", count: 1 },
  { id: 4, name: "Negocios", slug: "negocios", count: 1 },
  { id: 5, name: "Cultura", slug: "cultura", count: 1 },
];

export async function getPosts(limit?: number): Promise<PostUI[]> {
  if (!WP_API) {
    return limit ? mockPosts.slice(0, limit) : mockPosts;
  }

  try {
    const url = limit ? `${WP_API}/posts?_embed=1&per_page=${limit}` : `${WP_API}/posts?_embed=1`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("Failed to fetch posts");

    const data = await res.json();
    return data.map(normalizePost);
  } catch {
    return mockPosts;
  }
}

export async function getPostBySlug(slug: string): Promise<PostUI | null> {
  if (!WP_API) {
    return mockPosts.find((post) => post.slug === slug) || null;
  }

  try {
    const res = await fetch(`${WP_API}/posts?slug=${slug}&_embed=1`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("Failed to fetch post");

    const data = await res.json();
    return data[0] ? normalizePost(data[0]) : null;
  } catch {
    return mockPosts.find((post) => post.slug === slug) || null;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!WP_API) {
    return mockCategories;
  }

  try {
    const res = await fetch(`${WP_API}/categories`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Failed to fetch categories");

    const data = await res.json();
    return data.map((cat: { id: number; name: string; slug: string; count: number }) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.count,
    }));
  } catch {
    return mockCategories;
  }
}

export async function getPostsByCategory(categorySlug: string): Promise<PostUI[]> {
  if (!WP_API) {
    return mockPosts.filter((post) => post.categorySlug === categorySlug);
  }

  try {
    const categories = await getCategories();
    const category = categories.find((cat) => cat.slug === categorySlug);

    if (!category) return [];

    const res = await fetch(`${WP_API}/posts?categories=${category.id}&_embed=1`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("Failed to fetch posts by category");

    const data = await res.json();
    return data.map(normalizePost);
  } catch {
    return mockPosts.filter((post) => post.categorySlug === categorySlug);
  }
}

function normalizePost(post: any): PostUI {
  const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
  const categories = post._embedded?.["wp:term"]?.[0];
  const category = categories?.[0];

  return {
    id: post.id,
    slug: post.slug,
    title: post.title.rendered,
    excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, "").substring(0, 200),
    content: post.content.rendered,
    date: post.date,
    featuredImageUrl: featuredMedia?.source_url,
    categoryName: category?.name,
    categorySlug: category?.slug,
  };
}
