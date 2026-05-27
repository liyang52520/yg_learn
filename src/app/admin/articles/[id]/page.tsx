import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = id === "new" ? null : await prisma.article.findUnique({ where: { id: Number(id) } });
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{article ? "编辑文章" : "写文章"}</h1>
      <ArticleForm article={article} categories={categories} />
    </div>
  );
}
