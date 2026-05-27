import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function BookmarksPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: { question: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">收藏的题目</h1>
      <div className="space-y-3">
        {bookmarks.map((b) => (
          <Link key={b.id} href={`/quiz/${b.question.id}`} className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors">
            <h2 className="font-semibold">{b.question.title}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block">{b.question.category.name}</span>
          </Link>
        ))}
        {bookmarks.length === 0 && <p className="text-muted-foreground">暂无收藏</p>}
      </div>
    </div>
  );
}
