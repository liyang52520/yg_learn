import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/learn/ArticleCard";

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const articles = await prisma.article.findMany({
    where: { status: "published", ...(category ? { category: { slug: category } } : {}) },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
        {articles.length === 0 && <p className="text-muted-foreground">暂无文章</p>}
      </div>
    </div>
  );
}
