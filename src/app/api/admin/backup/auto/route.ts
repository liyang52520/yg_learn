import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildBackup, saveBackupToDisk } from "@/lib/backup";

const CONFIG_PATH = path.join(process.cwd(), "backups", "autobackup.json");

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {}
  return { enabled: false, frequency: "daily", lastRun: null };
}

function writeConfig(config: object) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function isDue(config: { enabled: boolean; frequency: string; lastRun: string | null }): boolean {
  if (!config.enabled) return false;
  if (!config.lastRun) return true;

  const last = new Date(config.lastRun);
  const now = new Date();

  switch (config.frequency) {
    case "hourly":
      return now.getTime() - last.getTime() > 60 * 60 * 1000;
    case "daily":
      return now.toDateString() !== last.toDateString();
    case "weekly": {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return last < weekAgo;
    }
    default:
      return false;
  }
}

export async function GET() {
  try {
    const config = readConfig();
    const backup = await buildBackup();
    const filename = await saveBackupToDisk(backup);

    if (config.enabled) {
      config.lastRun = new Date().toISOString();
      writeConfig(config);
    }

    const stats = Object.fromEntries(
      Object.entries(backup.data).map(([key, val]) => [key, (val as unknown[]).length])
    );

    return NextResponse.json({ ok: true, filename, stats });
  } catch (err) {
    console.error("Auto-backup failed:", err);
    return NextResponse.json({ error: "自动备份失败" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const config = readConfig();
    const newConfig = {
      enabled: body.enabled !== undefined ? body.enabled : config.enabled,
      frequency: body.frequency || config.frequency,
      lastRun: config.lastRun,
    };
    writeConfig(newConfig);
    return NextResponse.json({ ok: true, config: newConfig });
  } catch (err) {
    console.error("Update auto-backup config failed:", err);
    return NextResponse.json({ error: "配置更新失败" }, { status: 500 });
  }
}
