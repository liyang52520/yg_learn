import { prisma } from "@/lib/prisma";
import { extractBackupZip, restoreUploads } from "@/lib/backup";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any;
    let uploads: { filename: string; buffer: Buffer }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "请选择文件" }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith(".zip")) {
        const tmpPath = path.join(process.cwd(), "backups", `__articles_import_temp.zip`);
        fs.writeFileSync(tmpPath, buffer);
        try {
          const extracted = extractBackupZip(tmpPath);
          body = extracted.data;
          uploads = extracted.uploads;
        } finally {
          try { fs.unlinkSync(tmpPath); } catch {}
        }
      } else if (file.name.endsWith(".json")) {
        body = JSON.parse(buffer.toString("utf-8"));
      } else {
        return NextResponse.json({ error: "仅支持 .json 或 .zip 格式" }, { status: 400 });
      }
    } else {
      try { body = await req.json(); } catch {
        return NextResponse.json({ error: "无效的 JSON 格式" }, { status: 400 });
      }
    }

    if (body.version !== 1 || body.type !== "articles" || !body.data) {
      return NextResponse.json({ error: "备份文件格式无效" }, { status: 400 });
    }

    const { articleCategories, articles } = body.data;
    if (!Array.isArray(articleCategories) || !Array.isArray(articles)) {
      return NextResponse.json({ error: "数据格式无效" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert categories by slug, build old→new ID mapping
      const catIdMap = new Map<number, number>();
      let catCount = 0;
      for (const cat of articleCategories) {
        const { id, createdAt, updatedAt, ...catData } = cat;
        const upserted = await tx.articleCategory.upsert({
          where: { slug: cat.slug },
          create: catData,
          update: catData,
        });
        catIdMap.set(id, upserted.id);
        catCount++;
      }

      // Upsert articles by title with remapped categoryId
      let artCount = 0;
      for (const art of articles) {
        const { id, createdAt, updatedAt, categoryId, ...artData } = art;
        await tx.article.upsert({
          where: { title: art.title },
          create: { ...artData, categoryId: catIdMap.get(categoryId) ?? categoryId },
          update: { ...artData, categoryId: catIdMap.get(categoryId) ?? categoryId },
        });
        artCount++;
      }

      return { articleCategories: catCount, articles: artCount };
    });

    if (uploads.length > 0) {
      restoreUploads(uploads);
    }

    return NextResponse.json({ ok: true, imported: result, restoredUploads: uploads.length });
  } catch (err) {
    console.error("Import articles failed:", err);
    return NextResponse.json({ error: "导入失败" }, { status: 500 });
  }
}
