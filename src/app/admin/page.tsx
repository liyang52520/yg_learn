import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [users, articles, questions] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.question.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台概览</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">用户数</p>
          <p className="text-3xl font-bold">{users}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">文章数</p>
          <p className="text-3xl font-bold">{articles}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">题目数</p>
          <p className="text-3xl font-bold">{questions}</p>
        </div>
      </div>
    </div>
  );
}
