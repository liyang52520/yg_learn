import { buildSectionBackupAsync } from "@/lib/backup";
import { NextResponse } from "next/server";
import fs from "fs";

export async function POST() {
  try {
    const { filepath, stats } = await buildSectionBackupAsync("questions");
    const filename = filepath.split("/").pop() || "questions.zip";
    const content = fs.readFileSync(filepath);

    return new Response(content, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(content.length),
      },
    });
  } catch (err) {
    console.error("Export questions failed:", err);
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
