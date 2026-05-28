import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArticleRow } from "@/components/admin/ArticleRow";
import { SectionExportImport } from "@/components/admin/SectionExportImport";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <div className="flex items-center gap-3">
          <SectionExportImport
            exportUrl="/api/admin/backup/articles/export"
            importUrl="/api/admin/backup/articles/import"
            label="文章"
          />
          <Link href="/admin/articles/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
            写文章
          </Link>
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
          {articles.map((a) => (
            <ArticleRow key={a.id} article={a} />
          ))}
        </tbody>
      </table>
      {articles.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无文章</p>
      )}
    </div>
  );
}
