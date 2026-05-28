import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const question = await prisma.question.update({ where: { id: Number(id) }, data });
  return NextResponse.json(question);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.question.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
