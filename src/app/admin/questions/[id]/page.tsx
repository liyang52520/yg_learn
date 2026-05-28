import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function QuestionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = id === "new" ? null : await prisma.question.findUnique({ where: { id: Number(id) } });
  const categories = await prisma.questionCategory.findMany({ orderBy: { order: "asc" } });

  return <QuestionForm question={question} categories={categories} />;
}
