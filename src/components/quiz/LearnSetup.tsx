"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LearnSetup({ categories, userId }: { categories: any[]; userId: number }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  async function startLearning() {
    if (!count) return;
    setLoading(true);
    const res = await fetch("/api/quiz/pick", {
      method: "POST",
      body: JSON.stringify({ categoryId: categoryId ? Number(categoryId) : undefined, count }),
    });
    const data = await res.json();
    if (data.questionIds?.length > 0) {
      router.push(`/quiz/${data.questionIds[0]}?ids=${data.questionIds.join(",")}&mode=learn`);
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">选择分类</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border rounded-md px-3 py-2">
          <option value="">全部题目</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">学习数量</label>
        <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full border rounded-md px-3 py-2" />
      </div>
      <button onClick={startLearning} disabled={loading} className="bg-primary text-primary-foreground px-6 py-2 rounded-md disabled:opacity-50">
        {loading ? "加载中..." : "开始学习"}
      </button>
    </div>
  );
}
