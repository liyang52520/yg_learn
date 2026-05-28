"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export function QuestionRow({ question }: { question: any }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`确定删除「${question.title}」？`)) return;
    const res = await fetch(`/api/admin/questions/${question.id}`, { method: "DELETE" });
    if (!res.ok) { alert("删除失败"); return; }
    router.refresh();
  }

  async function handlePublish(status: string) {
    const res = await fetch(`/api/admin/questions/${question.id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { alert("操作失败，请刷新后重试"); return; }
    router.refresh();
  }

  return (
    <tr className="border-b">
      <td className="p-3">
        <div className="flex items-center gap-2">
          {question.title}
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              question.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {question.status === "published" ? "已发布" : "草稿"}
          </span>
        </div>
      </td>
      <td className="p-3 text-muted-foreground">{question.category.name}</td>
      <td className="p-3 text-muted-foreground">{new Date(question.updatedAt).toLocaleDateString("zh-CN")}</td>
      <td className="p-3 flex gap-2">
        <Link href={`/admin/questions/${question.id}`} className="text-primary text-sm">
          编辑
        </Link>
        {question.status !== "published" && (
          <button onClick={() => handlePublish("published")} className="text-green-600 text-sm hover:text-green-800">
            发布
          </button>
        )}
        {question.status === "published" && (
          <button onClick={() => handlePublish("draft")} className="text-orange-500 text-sm hover:text-orange-700">
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
