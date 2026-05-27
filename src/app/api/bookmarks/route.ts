import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId } = await req.json();
  const bookmark = await prisma.bookmark.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId },
    update: {},
  });
  return NextResponse.json(bookmark);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId } = await req.json();
  await prisma.bookmark.deleteMany({ where: { userId, questionId } });
  return NextResponse.json({ success: true });
}
