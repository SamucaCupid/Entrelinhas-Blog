"use client";

import { Menu, Search } from "lucide-react";
import { useState } from "react";
import type { Category, PostUI } from "@/types";
import { SearchModal } from "@/components/app/SearchModal";
import { HamburgerMenu } from "@/components/app/HamburgerMenu";

type SearchActionProps = {
  posts: PostUI[];
  className?: string;
  iconSize?: number;
};

export function SearchAction({ posts, className, iconSize = 18 }: SearchActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={className} aria-label="Buscar">
        <Search size={iconSize} />
      </button>
      <SearchModal isOpen={open} onClose={() => setOpen(false)} posts={posts} />
    </>
  );
}

type MenuActionProps = {
  className?: string;
  iconSize?: number;
  categories?: Category[];
};

export function MenuAction({ className, iconSize = 20, categories = [] }: MenuActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={className} aria-label="Abrir menu">
        <Menu size={iconSize} />
      </button>
      <HamburgerMenu isOpen={open} onClose={() => setOpen(false)} categories={categories} />
    </>
  );
}
