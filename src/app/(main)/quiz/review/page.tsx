import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReviewSession } from "@/components/quiz/ReviewSession";
import { redirect } from "next/navigation";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = Number(session.user.id);

  const [reviewQuestions, stats] = await Promise.all([
    prisma.userQuestionProgress.findMany({
      where: {
        userId,
        nextReviewDate: { lte: new Date() },
        repetitions: { gt: 0 },
      },
      include: { question: { include: { category: true } } },
      orderBy: { nextReviewDate: "asc" },
    }),
    prisma.userQuestionProgress.aggregate({
      where: { userId },
      _count: true,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">复习模式</h1>
      <p className="text-muted-foreground mb-6">
        已学习 {stats._count} 题，今日待复习 {reviewQuestions.length} 题
      </p>
      <ReviewSession questions={reviewQuestions} />
    </div>
  );
}
