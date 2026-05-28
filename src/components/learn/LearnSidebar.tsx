"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, Library } from "lucide-react";

export function LearnSidebar({ categories }: { categories: { slug: string; name: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  return (
    <aside className="w-56 border-r p-4 space-y-2 shrink-0 bg-background">
      <h2 className="font-bold text-lg mb-4">学习</h2>
      <Link
        href="/learn"
        className={`flex items-center gap-3 text-sm py-2 px-3 rounded-md transition-colors ${
          pathname === "/learn" && !currentCategory
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <BookOpen className="w-4 h-4" />
        全部文章
      </Link>
      <div className="pt-2 space-y-0.5">
        {categories.map((c) => {
          const isActive = currentCategory === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/learn?category=${c.slug}`}
              className={`flex items-center gap-3 text-sm py-2 px-3 rounded-md transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Library className="w-4 h-4" />
              {c.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
