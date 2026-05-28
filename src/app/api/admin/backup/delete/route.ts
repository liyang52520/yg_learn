import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function POST(req: Request) {
  try {
    const { filename } = await req.json();
    if (!filename || !filename.startsWith("backup-") || !filename.endsWith(".json")) {
      return NextResponse.json({ error: "无效的文件名" }, { status: 400 });
    }

    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: "备份文件不存在" }, { status: 404 });
    }

    fs.unlinkSync(filepath);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete backup failed:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
