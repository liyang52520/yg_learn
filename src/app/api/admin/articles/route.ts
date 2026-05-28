import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const article = await prisma.article.create({
    data: {
      title: data.title,
      summary: data.summary || null,
      categoryId: data.categoryId,
      content: data.content || "",
      status: data.status || "draft",
    },
  });
  return NextResponse.json(article);
}
