"use client";

import { useState, useEffect } from "react";
import { MemoryCurveChart } from "@/components/stats/MemoryCurveChart";

export function MemoryCurveChartWrapper(props: {
  intervalData: { rep: number; standard: number; user: number | null }[];
  scoreData: { rep: number; avgScore: number; count: number }[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="h-[300px]" />;
  return <MemoryCurveChart {...props} />;
}
