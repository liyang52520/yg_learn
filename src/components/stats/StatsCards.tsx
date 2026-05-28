export function StatsCards({
  totalLearned,
  totalReviewed,
  totalCorrect,
  totalAttempts,
  streak,
  pendingReview,
  bookmarksCount,
  totalQuestions,
}: {
  totalLearned: number;
  totalReviewed: number;
  totalCorrect: number;
  totalAttempts: number;
  streak: number;
  pendingReview: number;
  bookmarksCount: number;
  totalQuestions: number;
}) {
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const cards = [
    { label: "累计学习", value: totalLearned },
    { label: "累计复习", value: totalReviewed },
    { label: "正确率", value: `${accuracy}%` },
    { label: "连续打卡", value: `${streak} 天` },
    { label: "待复习", value: pendingReview },
    { label: "收藏", value: `${bookmarksCount} / ${totalQuestions}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
