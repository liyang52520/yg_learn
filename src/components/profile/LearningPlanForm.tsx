"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LearningPlanForm({
  settings,
  categories,
}: {
  settings: { dailyNewLimit: number; selectedCategoryIds: number[] };
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>(settings.selectedCategoryIds);
  const [dailyLimit, setDailyLimit] = useState(settings.dailyNewLimit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleCategory(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ dailyNewLimit: dailyLimit, categoryIds: selectedIds }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">每日新题上限</label>
        <input
          type="number"
          min={1}
          max={50}
          value={dailyLimit}
          onChange={(e) => setDailyLimit(Number(e.target.value))}
          className="w-full max-w-xs border rounded-md px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">复习题目不受此限制，会全部推送</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">选择学习分类</label>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无分类</p>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">未选择任何分类时，将推送全部题目的题目</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
        {saved && <span className="text-sm text-green-600">保存成功</span>}
      </div>
    </div>
  );
}
