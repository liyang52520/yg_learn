import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function POST(req: Request) {
  try {
    const { filename } = await req.json();
    if (!filename || !filename.startsWith("backup-") || !filename.endsWith(".zip")) {
      return NextResponse.json({ error: "无效的文件名" }, { status: 400 });
    }

    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: "备份文件不存在" }, { status: 404 });
    }

    const content = fs.readFileSync(filepath);

    return new Response(content, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(content.length),
      },
    });
  } catch (err) {
    console.error("Download backup failed:", err);
    return NextResponse.json({ error: "下载失败" }, { status: 500 });
  }
}
