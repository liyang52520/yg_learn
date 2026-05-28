import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnswerForm } from "@/components/quiz/AnswerForm";
import { notFound } from "next/navigation";

export default async function QuizQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { id } = await params;
  const { ids } = await searchParams;
  const session = await auth();
  const userId = Number(session?.user?.id);

  const question = await prisma.question.findFirst({
    where: { id: Number(id), status: "published" },
    include: { category: true },
  });
  if (!question) notFound();

  const idsFromParams = ids?.split(",").map(Number);
  const questionIds = idsFromParams?.length
    ? idsFromParams
    : await prisma.question.findMany({
        where: { status: "published" },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      }).then((qs) => qs.map((q) => q.id));
  const currentIndex = questionIds.indexOf(question.id);
  const prevId = currentIndex > 0 ? questionIds[currentIndex - 1] : null;
  const nextId = currentIndex < questionIds.length - 1 ? questionIds[currentIndex + 1] : null;

  const progress = await prisma.userQuestionProgress.findUnique({
    where: { userId_questionId: { userId, questionId: question.id } },
  });
  const isBookmarked = await prisma.bookmark.findUnique({
    where: { userId_questionId: { userId, questionId: question.id } },
  });
  const notes = await prisma.questionNote.findMany({
    where: { userId, questionId: question.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AnswerForm
      question={question}
      progress={progress}
      isBookmarked={!!isBookmarked}
      notes={notes}
      userId={userId}
      prevId={prevId}
      nextId={nextId}
      questionIds={questionIds}
    />
  );
}
