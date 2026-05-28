import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LearnSetup } from "@/components/quiz/LearnSetup";

export default async function QuizLearnPage() {
  const session = await auth();
  const categories = await prisma.questionCategory.findMany({ orderBy: { order: "asc" } });
  const userId = Number(session?.user?.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">今日学习</h1>
      <LearnSetup categories={categories} userId={userId} />
    </div>
  );
}
