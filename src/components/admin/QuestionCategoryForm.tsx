"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuestionCategoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await fetch("/api/admin/question-categories", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        order: Number(formData.get("order")),
      }),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">添加分类</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-card p-6 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold mb-4">添加题目分类</h2>
            <form action={handleSubmit} className="space-y-3">
              <input name="name" placeholder="分类名称" required className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="slug" placeholder="slug" required className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="description" placeholder="描述" className="w-full border rounded-md px-3 py-2 text-sm" />
              <input name="order" type="number" placeholder="排序" defaultValue={0} className="w-full border rounded-md px-3 py-2 text-sm" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border rounded-md text-sm">取消</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
