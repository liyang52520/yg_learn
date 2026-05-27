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

  return <ArticleReader article={article} highlights={highlights} userId={Number(session?.user?.id)} />;
}
