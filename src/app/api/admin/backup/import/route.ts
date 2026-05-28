import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBackupZip, restoreUploads } from "@/lib/backup";
import fs from "fs";
import path from "path";

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

function validateData(body: any): boolean {
  if (!body || body.version !== 1 || !body.data) return false;
  for (const key of BACKUP_KEYS) {
    if (!Array.isArray(body.data[key])) return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let body: any;
    let uploadFiles: { filename: string; buffer: Buffer }[] = [];

    if (contentType.includes("multipart/form-data")) {
      // ZIP file upload
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "请选择文件" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith(".zip")) {
        const tmpPath = path.join(process.cwd(), "backups", `__import_temp.zip`);
        fs.writeFileSync(tmpPath, buffer);
        try {
          const extracted = extractBackupZip(tmpPath);
          body = extracted.data;
          uploadFiles = extracted.uploads;
        } finally {
          try { fs.unlinkSync(tmpPath); } catch {}
        }
      } else if (file.name.endsWith(".json")) {
        const text = buffer.toString("utf-8");
        body = JSON.parse(text);
        if (!validateData(body)) {
          return NextResponse.json({ error: "JSON 备份文件格式无效" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "仅支持 .json 或 .zip 格式" }, { status: 400 });
      }
    } else {
      // JSON body upload (backward compatible)
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "无效的 JSON 格式" }, { status: 400 });
      }
    }

    if (!validateData(body)) {
      return NextResponse.json({ error: "备份文件格式无效，请确认版本正确" }, { status: 400 });
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

    if (uploadFiles.length > 0) {
      restoreUploads(uploadFiles);
    }

    return NextResponse.json({
      ok: true,
      imported: result,
      restoredUploads: uploadFiles.length,
    });
  } catch (err) {
    console.error("Import failed:", err);
    return NextResponse.json({ error: "恢复失败，请检查备份文件或服务器日志" }, { status: 500 });
  }
}
