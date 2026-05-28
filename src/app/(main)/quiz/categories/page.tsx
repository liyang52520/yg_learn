import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { QuizCategoryFilter } from "@/components/quiz/QuizCategoryFilter";

export default async function QuizCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const categories = await prisma.questionCategory.findMany({
    orderBy: { order: "asc" },
  });

  let questions;
  if (category) {
    const selectedCat = categories.find((c) => c.slug === category);
    questions = selectedCat
      ? await prisma.question.findMany({
          where: { categoryId: selectedCat.id },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        })
      : [];
  } else {
    questions = await prisma.question.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">题库</h1>
      <p className="text-sm text-muted-foreground mb-4">
        共 {questions.length} 道题目
      </p>

      <QuizCategoryFilter categories={categories} current={category || ""} />

      <div className="space-y-2">
        {questions.map((q) => (
          <Link
            key={q.id}
            href={`/quiz/${q.id}`}
            className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{q.title}</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                {q.category.name}
              </span>
            </div>
          </Link>
        ))}
        {questions.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">暂无题目</p>
        )}
      </div>
    </div>
  );
}
