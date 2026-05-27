import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { calculateSM2 } from "@/lib/sm2";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { questionId, score } = await req.json();

  const existing = await prisma.userQuestionProgress.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  const { ease, interval, repetitions, nextReviewDate } = calculateSM2(
    existing?.ease || 2.5,
    existing?.interval || 0,
    existing?.repetitions || 0,
    score
  );

  const progress = await prisma.userQuestionProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, ease, interval, repetitions, nextReviewDate, lastScore: score },
    update: { ease, interval, repetitions, nextReviewDate, lastScore: score },
  });

  return NextResponse.json(progress);
}
