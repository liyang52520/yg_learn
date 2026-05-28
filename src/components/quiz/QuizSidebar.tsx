"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Layers, Bookmark } from "lucide-react";

const navItems = [
  { href: "/quiz/learn", label: "今日学习", icon: BookOpen },
  { href: "/quiz/categories", label: "题库", icon: Layers },
  { href: "/quiz/bookmarks", label: "收藏", icon: Bookmark },
] as const;

export function QuizSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r p-4 space-y-2">
      <h2 className="font-bold text-lg mb-4">刷题</h2>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 text-sm py-2 px-3 rounded-md transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
