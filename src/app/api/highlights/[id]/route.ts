import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.articleHighlight.deleteMany({ where: { id: Number(id), userId: Number(session.user.id) } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { note } = await req.json();
  const highlight = await prisma.articleHighlight.updateMany({
    where: { id: Number(id), userId: Number(session.user.id) },
    data: { note },
  });
  return NextResponse.json(highlight);
}
