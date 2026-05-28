import { handleExport } from "@/lib/backup";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await handleExport();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Export failed:", err);
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
