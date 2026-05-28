import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CalendarHeatmap } from "@/components/stats/CalendarHeatmap";

export default async function Dashboard() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalQuestions, pendingReview, todayRecord, dailyRecords] = await Promise.all([
    prisma.userQuestionProgress.count({ where: { userId } }),
    prisma.userQuestionProgress.count({
      where: { userId, nextReviewDate: { lte: today }, repetitions: { gt: 0 } },
    }),
    prisma.dailyRecord.findFirst({
      where: { userId, date: { gte: today } },
    }),
    prisma.dailyRecord.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 365,
    }),
  ]);

  const todayLearned = todayRecord?.questionsLearned ?? 0;
  const todayReviewed = todayRecord?.questionsReviewed ?? 0;

  // Calculate streak
  let streak = 0;
  for (let i = 0; i < dailyRecords.length; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const recordDate = dailyRecords[i]?.date;
    if (recordDate && new Date(recordDate).toDateString() === d.toDateString()) {
      streak++;
    } else break;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">你好，{session?.user?.name}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">今日学习</p>
          <p className="text-2xl font-bold">{todayLearned}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">今日复习</p>
          <p className="text-2xl font-bold">{todayReviewed}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">待复习</p>
          <p className="text-2xl font-bold">{pendingReview}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">连续打卡</p>
          <p className="text-2xl font-bold">{streak} 天</p>
        </div>
      </div>

      <CalendarHeatmap records={dailyRecords} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/quiz/learn" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">今日学习</h2>
          <p className="text-sm text-muted-foreground">选择分类和学习数量，开始学习新题目</p>
        </Link>
        <Link href="/quiz/review" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">复习模式</h2>
          <p className="text-sm text-muted-foreground">{pendingReview > 0 ? `有 ${pendingReview} 道题待复习` : "暂无待复习题目"}</p>
        </Link>
        <Link href="/learn" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">查看文章</h2>
          <p className="text-sm text-muted-foreground">阅读技术文章，学习新知识</p>
        </Link>
        <Link href="/stats" className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
          <h2 className="font-semibold text-lg">学习统计</h2>
          <p className="text-sm text-muted-foreground">查看打卡日历和学习数据</p>
        </Link>
      </div>
    </div>
  );
}
