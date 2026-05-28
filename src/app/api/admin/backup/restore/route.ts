import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { extractBackupZip, restoreUploads } from "@/lib/backup";

const BACKUP_DIR = path.join(process.cwd(), "backups");

const MODEL_MAP: Record<string, string> = {
  users: "user",
  articleCategories: "articleCategory",
  questionCategories: "questionCategory",
  articles: "article",
  questions: "question",
  userSelectedCategories: "userSelectedCategory",
  userQuestionProgress: "userQuestionProgress",
  bookmarks: "bookmark",
  questionNotes: "questionNote",
  articleHighlights: "articleHighlight",
  dailyRecords: "dailyRecord",
};

const BACKUP_KEYS = Object.keys(MODEL_MAP);

const DELETE_TABLES = [
  "dailyRecord",
  "articleHighlight",
  "bookmark",
  "questionNote",
  "userQuestionProgress",
  "userSelectedCategory",
  "question",
  "questionCategory",
  "article",
  "articleCategory",
  "user",
] as const;

async function createManyChunked(model: string, records: unknown[]) {
  const CHUNK_SIZE = 50;
  let total = 0;
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    await (prisma[model as keyof typeof prisma] as any).createMany({ data: chunk });
    total += chunk.length;
  }
  return total;
}

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

    const { data: body, uploads } = extractBackupZip(filepath);

    if (body.version !== 1 || !body.data) {
      return NextResponse.json({ error: "备份文件格式无效" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const table of DELETE_TABLES) {
        await (tx[table as keyof typeof tx] as any).deleteMany();
      }
      await tx.$executeRawUnsafe("DELETE FROM sqlite_sequence");

      const inserted: Record<string, number> = {};
      for (const backupKey of BACKUP_KEYS) {
        const records = (body.data[backupKey] || []) as unknown[];
        if (records.length === 0) {
          inserted[backupKey] = 0;
          continue;
        }
        inserted[backupKey] = await createManyChunked(MODEL_MAP[backupKey], records);
      }
      return inserted;
    });

    // Restore uploaded files
    if (uploads.length > 0) {
      restoreUploads(uploads);
    }

    return NextResponse.json({ ok: true, imported: result, restoredUploads: uploads.length });
  } catch (err) {
    console.error("Restore failed:", err);
    return NextResponse.json({ error: "恢复失败，请检查备份文件或服务器日志" }, { status: 500 });
  }
}
