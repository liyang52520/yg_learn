import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { articleId, startOffset, endOffset, text, note } = await req.json();
  const highlight = await prisma.articleHighlight.create({
    data: { articleId, startOffset, endOffset, text, note, userId: Number(session.user.id) },
  });
  return NextResponse.json(highlight);
}
