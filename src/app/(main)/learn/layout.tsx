import { prisma } from "@/lib/prisma";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-56 border-r p-4 space-y-2 overflow-y-auto shrink-0">
        <a href="/learn" className="block text-sm font-bold mb-3 text-foreground">学习</a>
        <a href="/learn" className="block text-sm py-1 text-muted-foreground hover:text-foreground">全部</a>
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/learn?category=${c.slug}`}
            className="block text-sm py-1 pl-2 text-muted-foreground hover:text-foreground"
          >
            {c.name}
          </a>
        ))}
      </aside>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
