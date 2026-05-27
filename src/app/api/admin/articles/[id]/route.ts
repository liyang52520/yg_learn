import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const article = await prisma.article.update({ where: { id: Number(id) }, data });
  return NextResponse.json(article);
}
