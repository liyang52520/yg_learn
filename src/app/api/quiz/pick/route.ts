import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { categoryId, count } = await req.json();

  const allQuestions = await prisma.question.findMany({
    where: categoryId ? { categoryId } : {},
    select: { id: true },
  });

  const learned = await prisma.userQuestionProgress.findMany({
    where: { userId, questionId: { in: allQuestions.map((q) => q.id) } },
    select: { questionId: true },
  });
  const learnedIds = new Set(learned.map((l) => l.questionId));

  const available = allQuestions.filter((q) => !learnedIds.has(q.id));
  const shuffled = available.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  const questionIds = picked.map((q) => q.id);

  return NextResponse.json({ questionIds });
}
