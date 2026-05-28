import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function QuizCategoriesPage() {
  const categories = await prisma.questionCategory.findMany({
    include: { questions: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">按分类刷题</h1>
      <div className="space-y-6">
        {categories.map((c) => (
          <div key={c.id}>
            <h2 className="font-semibold mb-2">{c.name} ({c.questions.length})</h2>
            <div className="space-y-2">
              {c.questions.map((q) => (
                <Link key={q.id} href={`/quiz/${q.id}`} className="block bg-card border rounded-lg p-3 hover:border-primary transition-colors">
                  {q.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
