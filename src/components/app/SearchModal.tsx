"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PostUI } from "@/types";

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  posts: PostUI[];
};

export function SearchModal({ isOpen, onClose, posts }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.categoryName?.toLowerCase().includes(term),
    );
  }, [posts, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleSelect = (slug: string) => {
    handleClose();
    router.push(`/post/${slug}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-zinc-500 dark:text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar noticias..."
              autoFocus
              className="flex-1 text-lg outline-none bg-white text-zinc-900 placeholder-zinc-400 dark:bg-slate-800 dark:text-white dark:placeholder-zinc-500"
            />
            <button onClick={handleClose} className="text-2xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
              &times;
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-4">
          {query && results.length === 0 && <p className="text-center py-8 text-zinc-500 dark:text-zinc-400">Nenhum resultado encontrado para "{query}"</p>}

          {query && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold mb-4 text-zinc-600 dark:text-zinc-400">{results.length} resultado(s) encontrado(s)</p>
              {results.map((post) => (
                <button
                  key={post.id}
                  onClick={() => handleSelect(post.slug)}
                  className="flex gap-4 p-4 rounded-xl cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-slate-700 border border-zinc-200 dark:border-slate-700 text-left w-full"
                >
                  {post.featuredImageUrl && <img src={post.featuredImageUrl} alt={post.title} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />}
                  <div className="flex-1">
                    <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-bold px-2 py-0.5 rounded uppercase mb-2">{post.categoryName}</span>
                    <h3 className="font-bold text-sm mb-1 leading-tight text-zinc-900 dark:text-white">{post.title}</h3>
                    <p className="text-xs line-clamp-2 text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p>Digite para buscar noticias</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
