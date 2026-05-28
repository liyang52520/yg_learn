import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { QuizCategoryFilter } from "@/components/quiz/QuizCategoryFilter";

function getMasteryLevel(progress: { repetitions: number; interval: number; nextReviewDate: Date } | null) {
  if (!progress) return { level: 0, label: "未学习", color: "bg-muted-foreground/30" };

  const now = new Date();
  const isDue = new Date(progress.nextReviewDate) <= now;

  if (isDue && progress.repetitions > 0) return { level: 1, label: "待复习", color: "bg-orange-400" };
  if (progress.repetitions >= 4 && progress.interval >= 21) return { level: 3, label: "已掌握", color: "bg-green-500" };
  return { level: 2, label: "学习中", color: "bg-blue-400" };
}

export default async function QuizCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const session = await auth();
  const userId = Number(session?.user?.id);

  const categories = await prisma.questionCategory.findMany({
    orderBy: { order: "asc" },
  });

  let questions;
  if (category) {
    const selectedCat = categories.find((c) => c.slug === category);
    questions = selectedCat
      ? await prisma.question.findMany({
          where: { categoryId: selectedCat.id, status: "published" },
          include: { category: true },
          orderBy: { createdAt: "desc" },
        })
      : [];
  } else {
    questions = await prisma.question.findMany({
      where: { status: "published" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Fetch progress for all displayed questions
  const progressRecords = userId
    ? await prisma.userQuestionProgress.findMany({
        where: { userId, questionId: { in: questions.map((q) => q.id) } },
      })
    : [];
  const progressMap = new Map(progressRecords.map((p) => [p.questionId, p]));

  // Compute mastery distribution for current view
  const masteryCounts = { unlearned: 0, learning: 0, review: 0, mastered: 0 };
  const categoryMasteryMap: Record<number, { unlearned: number; learning: number; review: number; mastered: number }> = {};
  for (const q of questions) {
    const level = getMasteryLevel(progressMap.get(q.id) || null).level;
    if (level === 0) masteryCounts.unlearned++;
    else if (level === 1) masteryCounts.review++;
    else if (level === 3) masteryCounts.mastered++;
    else masteryCounts.learning++;

    // Per-category mastery (only meaningful when viewing all)
    if (!categoryMasteryMap[q.categoryId]) {
      categoryMasteryMap[q.categoryId] = { unlearned: 0, learning: 0, review: 0, mastered: 0 };
    }
    const m = categoryMasteryMap[q.categoryId];
    if (level === 0) m.unlearned++;
    else if (level === 1) m.review++;
    else if (level === 3) m.mastered++;
    else m.learning++;
  }

  const selectedCategory = category ? categories.find((c) => c.slug === category) : null;

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">题库</h1>
      <p className="text-sm text-muted-foreground mb-4">
        共 {questions.length} 道题目
      </p>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <QuizCategoryFilter
            categories={categories}
            current={category || ""}
          />

          <div className="space-y-2">
        {questions.map((q) => {
          const mastery = getMasteryLevel(progressMap.get(q.id) || null);
          return (
            <Link
              key={q.id}
              href={`/quiz/${q.id}`}
              className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${mastery.color}`} />
                  <h2 className="font-medium truncate">{q.title}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{mastery.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {q.category.name}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
        {questions.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">暂无题目</p>
        )}
      </div>
    </div>

    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-6 space-y-4">
        {/* Mastery distribution for current view */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">
            {selectedCategory ? selectedCategory.name : "全部题目"} - 掌握分布
          </h3>

          {questions.length > 0 && (
            <div className="h-3 bg-muted rounded-full overflow-hidden flex mb-4">
              {[
                { count: masteryCounts.mastered, color: "bg-green-500", label: "已掌握" },
                { count: masteryCounts.review, color: "bg-orange-400", label: "待复习" },
                { count: masteryCounts.learning, color: "bg-blue-400", label: "学习中" },
                { count: masteryCounts.unlearned, color: "bg-muted-foreground/20", label: "未学习" },
              ].map(({ count, color, label }) =>
                count > 0 ? (
                  <div
                    key={label}
                    className={`${color} first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${(count / questions.length) * 100}%` }}
                    title={`${label}: ${count}`}
                  />
                ) : null,
              )}
            </div>
          )}

          <div className="space-y-2 text-sm">
            {[
              { count: masteryCounts.unlearned, label: "未学习", color: "bg-muted-foreground/20" },
              { count: masteryCounts.learning, label: "学习中", color: "bg-blue-400" },
              { count: masteryCounts.review, label: "待复习", color: "bg-orange-400" },
              { count: masteryCounts.mastered, label: "已掌握", color: "bg-green-500" },
            ].map(({ count, label, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-muted-foreground">{label}</span>
                </span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex items-center justify-between font-medium">
              <span>共计</span>
              <span>{questions.length}</span>
            </div>
          </div>
        </div>

        {/* Per-category mastery when viewing all */}
        {!selectedCategory && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">各分类掌握分布</h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const m = categoryMasteryMap[cat.id];
                if (!m) return null;
                const catTotal = m.unlearned + m.learning + m.review + m.mastered;
                if (catTotal === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground truncate">{cat.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{catTotal}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                      {[
                        { count: m.mastered, color: "bg-green-500" },
                        { count: m.review, color: "bg-orange-400" },
                        { count: m.learning, color: "bg-blue-400" },
                        { count: m.unlearned, color: "bg-muted-foreground/20" },
                      ].map(({ count, color }) =>
                        count > 0 ? (
                          <div
                            key={color}
                            className={`${color} first:rounded-l-full last:rounded-r-full`}
                            style={{ width: `${(count / catTotal) * 100}%` }}
                          />
                        ) : null,
                      )}
                    </div>
                  </div>
                );
              })}
              {categories.every((cat) => !categoryMasteryMap[cat.id]) && (
                <p className="text-xs text-muted-foreground text-center py-2">暂无分类数据</p>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-card border rounded-lg p-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> 学习中</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> 待复习</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 已掌握</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</>
);
}
