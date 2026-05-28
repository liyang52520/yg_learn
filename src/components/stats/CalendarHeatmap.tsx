"use client";

import { useMemo, useState, useEffect } from "react";

interface DailyRecordSummary {
  date: Date;
  questionsLearned: number;
  questionsReviewed: number;
}

export function CalendarHeatmap({ records }: { records: DailyRecordSummary[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const weeks = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const key = new Date(r.date).toISOString().split("T")[0];
      map.set(key, (r.questionsLearned || 0) + (r.questionsReviewed || 0));
    });

    const result: { date: Date; count: number }[][] = [];
    const today = new Date();
    let d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    d.setDate(d.getDate() - d.getDay());

    let week: { date: Date; count: number }[] = [];
    while (d <= today) {
      const key = d.toISOString().split("T")[0];
      week.push({ date: new Date(d), count: map.get(key) || 0 });
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [records]);

  const maxCount = Math.max(...weeks.flat().map((d) => d.count), 1);

  function getColor(count: number) {
    if (count === 0) return "bg-muted/30";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-green-200";
    if (intensity < 0.5) return "bg-green-300";
    if (intensity < 0.75) return "bg-green-400";
    return "bg-green-500";
  }

  if (!mounted) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <h2 className="font-semibold mb-4">打卡日历（近一年）</h2>
        <div className="h-[120px]" />
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      <h2 className="font-semibold mb-4">打卡日历（近一年）</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                  title={`${day.date.getFullYear()}-${(day.date.getMonth() + 1).toString().padStart(2, "0")}-${day.date.getDate().toString().padStart(2, "0")}: ${day.count} 题`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-muted/30" />
        <div className="w-3 h-3 rounded-sm bg-green-200" />
        <div className="w-3 h-3 rounded-sm bg-green-300" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <span>多</span>
      </div>
    </div>
  );
}
