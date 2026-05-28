import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StatsCards } from "@/components/stats/StatsCards";
import { CalendarHeatmap } from "@/components/stats/CalendarHeatmap";
import { MemoryCurveChartWrapper } from "@/components/stats/MemoryCurveChartWrapper";
import { redirect } from "next/navigation";

async function computeMemoryCurveData(userId: number) {
  const progressRecords = await prisma.userQuestionProgress.findMany({
    where: { userId, repetitions: { gt: 0 } },
  });

  // Group by repetitions and compute averages
  const repGroups: Record<number, { intervals: number[]; scores: number[] }> = {};
  for (const p of progressRecords) {
    if (!repGroups[p.repetitions]) repGroups[p.repetitions] = { intervals: [], scores: [] };
    repGroups[p.repetitions].intervals.push(p.interval);
    if (p.lastScore) repGroups[p.repetitions].scores.push(p.lastScore);
  }

  // Standard SM-2 curve (default ease = 2.5)
  const standardCurve: { rep: number; interval: number }[] = [];
  let stdInterval = 0;
  const stdEase = 2.5;
  for (let rep = 1; rep <= 10; rep++) {
    if (rep === 1) stdInterval = 1;
    else if (rep === 2) stdInterval = 6;
    else stdInterval = Math.round(stdInterval * stdEase);
    standardCurve.push({ rep, interval: stdInterval });
  }

  // Build interval comparison data (only reps where user has data)
  const intervalData: { rep: number; standard: number; user: number | null }[] = [];
  for (const std of standardCurve) {
    const userRep = repGroups[std.rep];
    const avgInterval = userRep && userRep.intervals.length > 0
      ? userRep.intervals.reduce((a, b) => a + b, 0) / userRep.intervals.length
      : null;
    intervalData.push({
      rep: std.rep,
      standard: std.interval,
      // Only include user data if we have at least 2 records for meaningful average
      user: avgInterval !== null && userRep!.intervals.length >= 2 ? Math.round(avgInterval) : null,
    });
  }

  // Score by repetition level
  const scoreData: { rep: number; avgScore: number; count: number }[] = [];
  for (let rep = 1; rep <= 10; rep++) {
    const g = repGroups[rep];
    if (g && g.scores.length > 0) {
      const avgScore = g.scores.reduce((a, b) => a + b, 0) / g.scores.length;
      scoreData.push({ rep, avgScore: Math.round(avgScore * 10) / 10, count: g.scores.length });
    }
  }

  return { intervalData, scoreData };
}

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = Number(session.user.id);

  const [dailyRecords, totalProgress, totalQuestions, bookmarksCount, memoryCurveData] = await Promise.all([
    prisma.dailyRecord.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.userQuestionProgress.findMany({ where: { userId } }),
    prisma.question.count({ where: { status: "published" } }),
    prisma.bookmark.count({ where: { userId, question: { status: "published" } } }),
    computeMemoryCurveData(userId),
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

      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">记忆曲线</h2>
        {memoryCurveData.scoreData.length > 0 ? (
          <MemoryCurveChartWrapper
            intervalData={memoryCurveData.intervalData}
            scoreData={memoryCurveData.scoreData}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            暂无数据。开始答题并提交自评后，这里将展示你的记忆曲线与标准 SM-2 曲线的对比。
          </p>
        )}
      </div>
    </div>
  );
}
