import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ArticleReader } from "@/components/learn/ArticleReader";
import { notFound } from "next/navigation";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const article = await prisma.article.findUnique({ where: { id: Number(slug) } });
  if (!article) notFound();

  const highlights = await prisma.articleHighlight.findMany({
    where: { articleId: article.id, userId: Number(session?.user?.id) },
    orderBy: { createdAt: "desc" },
  });

  // Find prev/next articles in the same category
  const siblings = await prisma.article.findMany({
    where: { categoryId: article.categoryId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
  const currentIndex = siblings.findIndex((s) => s.id === article.id);
  const prevArticle = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;
  const nextArticle = currentIndex > 0 ? siblings[currentIndex - 1] : null;

  return (
    <ArticleReader
      article={article}
      highlights={highlights}
      userId={Number(session?.user?.id)}
      prevArticle={prevArticle ? { id: prevArticle.id, title: prevArticle.title } : null}
      nextArticle={nextArticle ? { id: nextArticle.id, title: nextArticle.title } : null}
    />
  );
}
