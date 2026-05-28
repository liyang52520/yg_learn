"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuizCategoryFilter({ categories, current }: { categories: { slug: string; name: string }[]; current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);

  function handleChange(slug: string) {
    setValue(slug);
    if (slug) {
      router.push(`/quiz/categories?category=${slug}`);
    } else {
      router.push("/quiz/categories");
    }
  }

  return (
    <div className="mb-6">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm"
      >
        <option value="">全部题目</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
