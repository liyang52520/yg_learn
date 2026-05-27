import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/learn/ArticleCard";

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });
  const articles = await prisma.article.findMany({
    where: category ? { category: { slug: category } } : {},
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-56 border-r p-4 space-y-2">
        <a href="/learn" className={`block text-sm py-1 ${!category ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}>全部</a>
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/learn?category=${c.slug}`}
            className={`block text-sm py-1 ${category === c.slug ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {c.name}
          </a>
        ))}
      </aside>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl space-y-4">
          {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
          {articles.length === 0 && <p className="text-muted-foreground">暂无文章</p>}
        </div>
      </div>
    </div>
  );
}
