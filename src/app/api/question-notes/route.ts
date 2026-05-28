import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId, content } = await req.json();
  const note = await prisma.questionNote.create({ data: { userId, questionId, content } });
  return NextResponse.json(note);
}
