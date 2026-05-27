"use client";

import { useMemo } from "react";

interface DailyRecordSummary {
  date: Date;
  questionsLearned: number;
  questionsReviewed: number;
}

export function CalendarHeatmap({ records }: { records: DailyRecordSummary[] }) {
  const dayData = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const key = new Date(r.date).toISOString().split("T")[0];
      map.set(key, (r.questionsLearned || 0) + (r.questionsReviewed || 0));
    });
    return map;
  }, [records]);

  const weeks = useMemo(() => {
    const result: { date: Date; count: number }[][] = [];
    const today = new Date();
    let d = new Date(today);
    d.setFullYear(d.getFullYear() - 1);
    d.setDate(d.getDate() - d.getDay());

    let week: { date: Date; count: number }[] = [];
    while (d <= today) {
      const key = d.toISOString().split("T")[0];
      week.push({ date: new Date(d), count: dayData.get(key) || 0 });
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [dayData]);

  const maxCount = Math.max(...Array.from(dayData.values()), 1);

  function getColor(count: number) {
    if (count === 0) return "bg-muted/30";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return "bg-green-200";
    if (intensity < 0.5) return "bg-green-300";
    if (intensity < 0.75) return "bg-green-400";
    return "bg-green-500";
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
                  title={`${day.date.toLocaleDateString()}: ${day.count} 题`}
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
