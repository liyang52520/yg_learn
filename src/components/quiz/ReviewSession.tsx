"use client";

import DOMPurify from "dompurify";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProseContent } from "@/components/shared/ProseContent";

interface ReviewQuestion {
  questionId: number;
  question: {
    id: number;
    title: string;
    content: string;
    answer: string;
    category: { id: number; name: string; slug: string; description: string | null; order: number };
  };
}

export function ReviewSession({ questions }: { questions: ReviewQuestion[] }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const question = questions[currentIndex];
  if (!question || questions.length === 0) {
    return <p className="text-muted-foreground">暂无待复习题目，太棒了！</p>;
  }

  async function handleSubmit() {
    setSubmitted(true);
  }

  async function handleScore(s: number) {
    setSaving(true);
    setError("");
    try {
      const progressRes = await fetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({ questionId: question.questionId, score: s }),
      });
      if (progressRes.status === 429) {
        const data = await progressRes.json();
        setError(data.error);
        setSaving(false);
        return;
      }
      await fetch("/api/daily-record", {
        method: "POST",
        body: JSON.stringify({ questionId: question.questionId, score: s, mode: "review" }),
      });
      setScore(s);
      setCompleted(completed + 1);
    } catch {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setSubmitted(false);
      setScore(null);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  const sanitizedContent = DOMPurify.sanitize(question.question.content);
  const sanitizedAnswer = DOMPurify.sanitize(question.question.answer);

  const scoreOptions = [
    { v: 0, label: "完全忘记" },
    { v: 1, label: "很模糊" },
    { v: 2, label: "有点困难" },
    { v: 3, label: "答对了" },
    { v: 4, label: "轻松" },
    { v: 5, label: "非常轻松" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>{currentIndex + 1} / {questions.length}</span>
        <span className="bg-muted px-2 py-0.5 rounded">{question.question.category.name}</span>
        <span>已完成: {completed}</span>
      </div>

      <ProseContent html={sanitizedContent} className="prose prose-lg max-w-none mb-6" />

      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="输入你的答案..."
        className="w-full border rounded-md p-4 min-h-[120px]"
        disabled={submitted}
      />

      {!submitted && (
        <button onClick={handleSubmit} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-md">
          提交答案
        </button>
      )}

      {submitted && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">参考答案</h3>
            <ProseContent html={sanitizedAnswer} className="prose prose-sm max-w-none" />
          </div>

          {score === null && (
            <div>
              <h3 className="font-semibold mb-2">自评</h3>
              <div className="flex gap-2">
                {scoreOptions.map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => handleScore(v)}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      score === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {score !== null && (
            <button onClick={next} className="bg-primary text-primary-foreground px-6 py-2 rounded-md">
              {currentIndex < questions.length - 1 ? "下一题" : "完成复习"}
            </button>
          )}

          {saving && <p className="text-sm text-muted-foreground">保存中...</p>}
        </div>
      )}
    </div>
  );
}
