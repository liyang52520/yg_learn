import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LearningPlanForm } from "@/components/profile/LearningPlanForm";

export default async function ProfilePage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const [user, categories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { selectedCategories: true },
    }),
    prisma.questionCategory.findMany({ orderBy: { order: "asc" } }),
  ]);

  const selectedCategoryIds = user?.selectedCategories.map((s) => s.categoryId) ?? [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">学习设置</h1>
      <LearningPlanForm
        settings={{ dailyNewLimit: user?.dailyNewLimit ?? 5, selectedCategoryIds }}
        categories={categories}
      />
    </div>
  );
}
