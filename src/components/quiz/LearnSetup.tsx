"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LearnSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startLearning() {
    setLoading(true);

    try {
      const [newRes, reviewRes] = await Promise.all([
        fetch("/api/quiz/pick", { method: "POST" }),
        fetch("/api/quiz/review-pick", { method: "POST" }),
      ]);

      const [newData, reviewData] = await Promise.all([newRes.json(), reviewRes.json()]);

      const newIds: number[] = newData.questionIds || [];
      const reviewIds: number[] = reviewData.questionIds || [];
      const allIds = [...newIds, ...reviewIds];

      if (allIds.length > 0) {
        router.push(`/quiz/${allIds[0]}?ids=${allIds.join(",")}`);
      } else {
        alert("当前没有可学习的题目，请先去学习设置中选择分类");
        setLoading(false);
      }
    } catch {
      alert("加载失败，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <button
        onClick={startLearning}
        disabled={loading}
        className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-base font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "加载中..." : "开始今日学习"}
      </button>
    </div>
  );
}
