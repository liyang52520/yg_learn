"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export function ArticleRow({ article }: { article: any }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`确定删除「${article.title}」？`)) return;
    await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <tr className="border-b">
      <td className="p-3">
        <div className="flex items-center gap-2">
          {article.title}
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              article.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {article.status === "published" ? "已发布" : "草稿"}
          </span>
        </div>
      </td>
      <td className="p-3 text-muted-foreground">{article.category.name}</td>
      <td className="p-3 text-muted-foreground">{new Date(article.updatedAt).toLocaleDateString("zh-CN")}</td>
      <td className="p-3 flex gap-2">
        <Link href={`/admin/articles/${article.id}`} className="text-primary text-sm">
          编辑
        </Link>
        {article.status === "draft" && (
          <button
            onClick={async () => {
              await fetch(`/api/admin/articles/${article.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: "published" }),
              });
              router.refresh();
            }}
            className="text-green-600 text-sm hover:text-green-800"
          >
            发布
          </button>
        )}
        {article.status === "published" && (
          <button
            onClick={async () => {
              await fetch(`/api/admin/articles/${article.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: "draft" }),
              });
              router.refresh();
            }}
            className="text-orange-500 text-sm hover:text-orange-700"
          >
            下架
          </button>
        )}
        <button onClick={handleDelete} className="text-red-500 text-sm hover:text-red-700">
          删除
        </button>
      </td>
    </tr>
  );
}
