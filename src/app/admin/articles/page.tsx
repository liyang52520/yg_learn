import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link href="/admin/articles/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">写文章</Link>
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
          {articles.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="p-3">{a.title}</td>
              <td className="p-3 text-muted-foreground">{a.category.name}</td>
              <td className="p-3 text-muted-foreground">{new Date(a.updatedAt).toLocaleDateString()}</td>
              <td className="p-3">
                <Link href={`/admin/articles/${a.id}`} className="text-primary text-sm">编辑</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
