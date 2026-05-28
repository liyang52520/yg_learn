import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LearnSetup } from "@/components/quiz/LearnSetup";

export default async function QuizLearnPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const today = new Date();

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        include: { selectedCategories: true },
      })
    : null;

  const selectedCategoryIds = user?.selectedCategories.map((sc) => sc.categoryId) ?? [];
  const categoryFilter = selectedCategoryIds.length > 0 ? { categoryId: { in: selectedCategoryIds } } : {};

  const [newCount, reviewCount, dailyLimit] = await Promise.all([
    prisma.question.count({
      where: {
        status: "published",
        ...categoryFilter,
        ...(userId ? { NOT: { progressRecords: { some: { userId } } } } : {}),
      },
    }),
    userId
      ? prisma.userQuestionProgress.count({
          where: {
            userId,
            nextReviewDate: { lte: today },
            repetitions: { gt: 0 },
            question: { status: "published", ...categoryFilter },
          },
        })
      : Promise.resolve(0),
    Promise.resolve(user?.dailyNewLimit ?? 5),
  ]);

  const totalCount = newCount + reviewCount;

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">今日学习</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">今日待学</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">新题（每日上限 {dailyLimit}）</p>
          <p className="text-2xl font-bold">{newCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">待复习</p>
          <p className="text-2xl font-bold">{reviewCount}</p>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        基于你的学习计划推送题目
        {selectedCategoryIds.length > 0 && (
          <>，仅含已选分类</>
        )}
        {selectedCategoryIds.length === 0 && (
          <>，包含所有分类</>
        )}
        。新题最多 {dailyLimit} 道，复习不限。
      </div>

      <LearnSetup />
    </>
  );
}
