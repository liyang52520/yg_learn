"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export function MemoryCurveChart({
  intervalData,
  scoreData,
}: {
  intervalData: { rep: number; standard: number; user: number | null }[];
  scoreData: { rep: number; avgScore: number; count: number }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Interval growth curve */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-1">间隔增长曲线</h3>
        <p className="text-xs text-muted-foreground mb-4">
          每次复习后，下次复习间隔的理想增长 vs 实际增长（基于 SM-2 算法，默认难度系数 2.5）
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={intervalData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="rep" tick={{ fontSize: 12 }} label={{ value: "复习次数", position: "insideBottom", offset: -5, fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: "间隔 (天)", angle: -90, position: "insideLeft", offset: 10, fontSize: 12 }}
              scale="log"
              domain={["auto", "auto"]}
            />
            <Tooltip formatter={(value: any) => [`${Math.round(Number(value))} 天`]} labelFormatter={(label: any) => `第 ${label} 次复习`} />
            <Legend />
            <Line type="monotone" dataKey="standard" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="标准曲线" connectNulls={false} />
            <Line type="monotone" dataKey="user" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} name="你的曲线" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Score by repetition */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-1">各阶段掌握情况</h3>
        <p className="text-xs text-muted-foreground mb-4">
          每次复习时的自评平均分（1-5 分），反映在不同阶段的知识掌握程度
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={scoreData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="rep" tick={{ fontSize: 12 }} label={{ value: "复习次数", position: "insideBottom", offset: -5, fontSize: 12 }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} label={{ value: "平均分", angle: -90, position: "insideLeft", offset: 10, fontSize: 12 }} />
            <Tooltip formatter={(value: any, name: any) => {
              if (name === "avgScore") return [`${Number(value).toFixed(1)} 分`];
              return [String(value), "题目数"];
            }} labelFormatter={(label: any) => `第 ${label} 次复习`} />
            <Legend />
            <Bar dataKey="avgScore" fill="#22c55e" radius={[4, 4, 0, 0]} name="平均分" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
