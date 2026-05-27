"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TipTapEditor } from "./TipTapEditor";

export function ArticleForm({ article, categories }: { article: any; categories: any[] }) {
  const router = useRouter();
  const [content, setContent] = useState(article?.content || "");

  async function handleSubmit(formData: FormData) {
    const res = await fetch(`/api/admin/articles${article ? `/${article.id}` : ""}`, {
      method: article ? "PUT" : "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        summary: formData.get("summary"),
        categoryId: Number(formData.get("categoryId")),
        content,
      }),
    });
    if (res.ok) router.push("/admin/articles");
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-4">
      <input name="title" defaultValue={article?.title} placeholder="文章标题" required className="w-full border rounded-md px-3 py-2" />
      <input name="summary" defaultValue={article?.summary || ""} placeholder="文章摘要（可选）" className="w-full border rounded-md px-3 py-2" />
      <select name="categoryId" defaultValue={article?.categoryId} required className="w-full border rounded-md px-3 py-2">
        <option value="">选择分类</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <TipTapEditor content={content} onChange={setContent} />
      <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md">保存</button>
    </form>
  );
}
