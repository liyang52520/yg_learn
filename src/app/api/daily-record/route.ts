import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId, score, mode } = await req.json();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyRecord.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const isCorrect = score >= 3 ? 1 : 0;
  const isNew = mode === "review" ? 0 : 1;

  if (existing) {
    await prisma.dailyRecord.update({
      where: { userId_date: { userId, date: today } },
      data: {
        questionsLearned: existing.questionsLearned + isNew,
        questionsReviewed: existing.questionsReviewed + (mode === "review" || existing.questionsLearned > 0 ? 1 : 0),
        correctCount: existing.correctCount + isCorrect,
      },
    });
  } else {
    await prisma.dailyRecord.create({
      data: {
        userId,
        date: today,
        questionsLearned: isNew,
        questionsReviewed: mode === "review" ? 1 : 0,
        correctCount: isCorrect,
      },
    });
  }

  return NextResponse.json({ success: true });
}
