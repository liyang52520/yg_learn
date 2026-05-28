import { getBackupList } from "@/lib/backup";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "backups", "autobackup.json");

function readAutoConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {}
  return { enabled: false, frequency: "daily", lastRun: null };
}

export async function GET() {
  try {
    const files = await getBackupList();
    const autoConfig = readAutoConfig();
    return NextResponse.json({ files, autoConfig });
  } catch (err) {
    console.error("List backups failed:", err);
    return NextResponse.json({ error: "获取备份列表失败" }, { status: 500 });
  }
}
