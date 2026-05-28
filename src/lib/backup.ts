import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Extract image filenames from HTML content */
function extractImageFilenames(content: string): string[] {
  const names: string[] = [];
  const regex = /\/uploads\/([^"'\s?]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1]);
  }
  return [...new Set(names)];
}

function collectUploadsForContent(content: string): { filename: string; buffer: Buffer }[] {
  const filenames = extractImageFilenames(content);
  const result: { filename: string; buffer: Buffer }[] = [];
  for (const name of filenames) {
    const filepath = path.join(UPLOADS_DIR, name);
    if (fs.existsSync(filepath)) {
      result.push({ filename: name, buffer: fs.readFileSync(filepath) });
    }
  }
  return result;
}

function addContentUploadsToZip(zip: AdmZip, contents: string[]) {
  const added = new Set<string>();
  for (const content of contents) {
    const files = collectUploadsForContent(content);
    for (const { filename, buffer } of files) {
      if (!added.has(filename)) {
        added.add(filename);
        zip.addFile(`uploads/${filename}`, buffer);
      }
    }
  }
}

export async function buildBackup() {
  const [
    users,
    articleCategories,
    articles,
    questionCategories,
    questions,
    userSelectedCategories,
    userQuestionProgress,
    bookmarks,
    questionNotes,
    dailyRecords,
    articleHighlights,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.articleCategory.findMany(),
    prisma.article.findMany(),
    prisma.questionCategory.findMany(),
    prisma.question.findMany(),
    prisma.userSelectedCategory.findMany(),
    prisma.userQuestionProgress.findMany(),
    prisma.bookmark.findMany(),
    prisma.questionNote.findMany(),
    prisma.dailyRecord.findMany(),
    prisma.articleHighlight.findMany(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      users,
      articleCategories,
      articles,
      questionCategories,
      questions,
      userSelectedCategories,
      userQuestionProgress,
      bookmarks,
      questionNotes,
      dailyRecords,
      articleHighlights,
    },
  };
}

export async function saveBackupToDisk(backup: object): Promise<string> {
  ensureDir(BACKUP_DIR);

  const now = new Date();
  const filename = `backup-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}-${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}-${now.getSeconds().toString().padStart(2, "0")}.zip`;
  const filepath = path.join(BACKUP_DIR, filename);

  const zip = new AdmZip();
  zip.addFile("data.json", Buffer.from(JSON.stringify(backup, null, 2), "utf-8"));

  // Add all uploads
  if (fs.existsSync(UPLOADS_DIR)) {
    const uploadFiles = fs.readdirSync(UPLOADS_DIR);
    for (const f of uploadFiles) {
      const filePath = path.join(UPLOADS_DIR, f);
      if (fs.statSync(filePath).isFile()) {
        zip.addLocalFile(filePath, "uploads");
      }
    }
  }

  zip.writeZip(filepath);
  return filename;
}

export async function handleExport() {
  const backup = await buildBackup();
  const filename = await saveBackupToDisk(backup);
  const stats = Object.fromEntries(
    Object.entries(backup.data).map(([key, val]) => [key, (val as unknown[]).length])
  );
  let uploadCount = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    uploadCount = fs.readdirSync(UPLOADS_DIR).filter((f) => fs.statSync(path.join(UPLOADS_DIR, f)).isFile()).length;
  }
  return { filename, stats, uploadCount, backup };
}

export async function getBackupList() {
  ensureDir(BACKUP_DIR);
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup-") && f.endsWith(".zip"))
    .sort()
    .reverse();

  return files.map((f) => {
    const filepath = path.join(BACKUP_DIR, f);
    const stat = fs.statSync(filepath);
    let stats: Record<string, number> = {};
    try {
      const zip = new AdmZip(filepath);
      const entry = zip.getEntry("data.json");
      if (entry) {
        const parsed = JSON.parse(entry.getData().toString("utf-8"));
        stats = Object.fromEntries(
          Object.entries(parsed.data || {}).map(([key, val]) => [key, (val as unknown[]).length])
        );
      }
    } catch {}
    let uploadCount = 0;
    try {
      const zip = new AdmZip(filepath);
      uploadCount = zip.getEntries().filter((e) => e.entryName.startsWith("uploads/") && !e.isDirectory).length;
    } catch {}
    return {
      filename: f,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      stats: { ...stats, uploads: uploadCount },
    };
  });
}

export function extractBackupZip(filepath: string): { data: any; uploads: { filename: string; buffer: Buffer }[] } {
  const zip = new AdmZip(filepath);
  const dataEntry = zip.getEntry("data.json");
  if (!dataEntry) throw new Error("备份文件缺少 data.json");
  const data = JSON.parse(dataEntry.getData().toString("utf-8"));
  const uploads: { filename: string; buffer: Buffer }[] = [];
  const uploadEntries = zip.getEntries().filter((e) => e.entryName.startsWith("uploads/") && !e.isDirectory);
  for (const entry of uploadEntries) {
    const filename = path.basename(entry.entryName);
    uploads.push({ filename, buffer: entry.getData() });
  }
  return { data, uploads };
}

export function restoreUploads(uploads: { filename: string; buffer: Buffer }[]) {
  ensureDir(UPLOADS_DIR);
  for (const { filename, buffer } of uploads) {
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  }
}

/** Build a section backup (articles or questions) as a local ZIP file, returns the filepath */
export async function buildSectionBackupAsync(
  type: "articles" | "questions",
): Promise<{ filepath: string; stats: Record<string, number>; uploadCount: number }> {
  ensureDir(BACKUP_DIR);
  const now = new Date();
  const filename = `${type}-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}.zip`;
  const filepath = path.join(BACKUP_DIR, filename);

  let data: any;
  if (type === "articles") {
    const [categories, articles] = await Promise.all([
      prisma.articleCategory.findMany(),
      prisma.article.findMany(),
    ]);
    data = { articleCategories: categories, articles };
  } else {
    const [categories, questions] = await Promise.all([
      prisma.questionCategory.findMany(),
      prisma.question.findMany(),
    ]);
    data = { questionCategories: categories, questions };
  }

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    type,
    data,
  };

  const zip = new AdmZip();
  zip.addFile("data.json", Buffer.from(JSON.stringify(backup, null, 2), "utf-8"));

  // Collect image references from content fields
  const contentFields: string[] = [];
  if (type === "articles") {
    for (const a of (data.articles || []) as any[]) {
      if (a.content) contentFields.push(a.content);
    }
  } else {
    for (const q of (data.questions || []) as any[]) {
      if (q.content) contentFields.push(q.content);
      if (q.answer) contentFields.push(q.answer);
    }
  }
  addContentUploadsToZip(zip, contentFields);

  zip.writeZip(filepath);

  const stats: Record<string, number> = {};
  if (type === "articles") {
    stats.articleCategories = (data.articleCategories || []).length;
    stats.articles = (data.articles || []).length;
  } else {
    stats.questionCategories = (data.questionCategories || []).length;
    stats.questions = (data.questions || []).length;
  }

  const zipRead = new AdmZip(filepath);
  const uploadCount = zipRead.getEntries().filter((e) => e.entryName.startsWith("uploads/") && !e.isDirectory).length;

  return { filepath, stats, uploadCount };
}
