import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { selectedCategories: true },
  });
  const selectedCategoryIds = user?.selectedCategories.map((sc) => sc.categoryId) ?? [];
  const categoryFilter = selectedCategoryIds.length > 0 ? { categoryId: { in: selectedCategoryIds } } : {};

  const progressRecords = await prisma.userQuestionProgress.findMany({
    where: {
      userId,
      repetitions: { gt: 0 },
      nextReviewDate: { lte: new Date() },
      question: { status: "published", ...categoryFilter },
    },
    include: { question: { select: { id: true } } },
    orderBy: { nextReviewDate: "asc" },
  });

  const questionIds = progressRecords.map((r) => r.question.id);
  return NextResponse.json({ questionIds });
}
