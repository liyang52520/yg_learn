import { prisma } from "@/lib/prisma";
import { ArticleCategoryForm } from "@/components/admin/ArticleCategoryForm";

export default async function ArticleCategoriesPage() {
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">文章分类管理</h1>
      <ArticleCategoryForm />
      <table className="w-full mt-6 border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">排序</th>
            <th className="text-left p-3">名称</th>
            <th className="text-left p-3">Slug</th>
            <th className="text-left p-3">描述</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-3">{c.order}</td>
              <td className="p-3">{c.name}</td>
              <td className="p-3 text-muted-foreground">{c.slug}</td>
              <td className="p-3 text-muted-foreground">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
