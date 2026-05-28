import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { QuestionRow } from "@/components/admin/QuestionRow";
import { SectionExportImport } from "@/components/admin/SectionExportImport";

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">题目管理</h1>
        <div className="flex items-center gap-3">
          <SectionExportImport
            exportUrl="/api/admin/backup/questions/export"
            importUrl="/api/admin/backup/questions/import"
            label="题目"
          />
          <Link href="/admin/questions/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">添加题目</Link>
        </div>
      </div>
      <table className="w-full border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">标题</th>
            <th className="text-left p-3">分类</th>
            <th className="text-left p-3">更新时间</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <QuestionRow key={q.id} question={q} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
