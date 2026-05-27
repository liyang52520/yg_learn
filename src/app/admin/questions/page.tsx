import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">题目管理</h1>
        <Link href="/admin/questions/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">添加题目</Link>
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
            <tr key={q.id} className="border-b">
              <td className="p-3">{q.title}</td>
              <td className="p-3 text-muted-foreground">{q.category.name}</td>
              <td className="p-3 text-muted-foreground">{new Date(q.updatedAt).toLocaleDateString()}</td>
              <td className="p-3">
                <Link href={`/admin/questions/${q.id}`} className="text-primary text-sm">编辑</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
