import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function QuestionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = id === "new" ? null : await prisma.question.findUnique({ where: { id: Number(id) } });
  const categories = await prisma.questionCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{question ? "编辑题目" : "添加题目"}</h1>
      <QuestionForm question={question} categories={categories} />
    </div>
  );
}
