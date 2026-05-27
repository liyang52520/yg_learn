"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TipTapEditor } from "./TipTapEditor";

export function QuestionForm({ question, categories }: { question: any; categories: any[] }) {
  const router = useRouter();
  const [content, setContent] = useState(question?.content || "");
  const [answer, setAnswer] = useState(question?.answer || "");

  async function handleSubmit(formData: FormData) {
    const res = await fetch(`/api/admin/questions${question ? `/${question.id}` : ""}`, {
      method: question ? "PUT" : "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        categoryId: Number(formData.get("categoryId")),
        content,
        answer,
      }),
    });
    if (res.ok) router.push("/admin/questions");
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-4">
      <input name="title" defaultValue={question?.title} placeholder="题目标题" required className="w-full border rounded-md px-3 py-2" />
      <select name="categoryId" defaultValue={question?.categoryId} required className="w-full border rounded-md px-3 py-2">
        <option value="">选择分类</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div>
        <label className="block text-sm font-medium mb-1">题目内容</label>
        <TipTapEditor content={content} onChange={setContent} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">参考答案</label>
        <TipTapEditor content={answer} onChange={setAnswer} />
      </div>
      <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md">保存</button>
    </form>
  );
}
