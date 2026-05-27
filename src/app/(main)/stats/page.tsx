import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StatsCards } from "@/components/stats/StatsCards";
import { CalendarHeatmap } from "@/components/stats/CalendarHeatmap";
import { redirect } from "next/navigation";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = Number(session.user.id);

  const [dailyRecords, totalProgress, totalQuestions, bookmarksCount] = await Promise.all([
    prisma.dailyRecord.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.userQuestionProgress.findMany({ where: { userId } }),
    prisma.question.count(),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  const totalLearned = dailyRecords.reduce((s, r) => s + r.questionsLearned, 0);
  const totalReviewed = dailyRecords.reduce((s, r) => s + r.questionsReviewed, 0);
  const totalCorrect = dailyRecords.reduce((s, r) => s + r.correctCount, 0);
  const totalAttempts = totalLearned + totalReviewed;

  // Calculate streak from most recent activity date
  let streak = 0;
  if (dailyRecords.length > 0) {
    const mostRecent = new Date(dailyRecords[0].date);
    const today = new Date();
    const daysSinceActivity = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity <= 1) {
      streak = 1;
      for (let i = 1; i < dailyRecords.length; i++) {
        const expected = new Date(mostRecent);
        expected.setDate(expected.getDate() - i);
        const recordDate = dailyRecords[i]?.date;
        if (recordDate && new Date(recordDate).toDateString() === expected.toDateString()) {
          streak++;
        } else break;
      }
    }
  }

  const now = new Date();
  const pendingReview = totalProgress.filter((p) => new Date(p.nextReviewDate) <= now && p.repetitions > 0).length;

  // Prepare calendar data
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const yearRecords = dailyRecords.filter((r) => new Date(r.date) >= lastYear);

  const totalQuestionsCount = totalQuestions;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">学习统计</h1>

      <StatsCards
        totalLearned={totalLearned}
        totalReviewed={totalReviewed}
        totalCorrect={totalCorrect}
        totalAttempts={totalAttempts}
        streak={streak}
        pendingReview={pendingReview}
        bookmarksCount={bookmarksCount}
        totalQuestions={totalQuestionsCount}
      />

      <CalendarHeatmap records={yearRecords} />
    </div>
  );
}
