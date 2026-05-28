import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const article = await prisma.article.update({
    where: { id: Number(id) },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
  return NextResponse.json(article);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.article.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
