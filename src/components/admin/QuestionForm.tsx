"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { TipTapEditor } from "./TipTapEditor";
import { Save } from "lucide-react";

export function QuestionForm({ question, categories }: { question: any; categories: any[] }) {
  const router = useRouter();
  const [questionId, setQuestionId] = useState<number | null>(question?.id || null);
  const [title, setTitle] = useState(question?.title || "");
  const [categoryId, setCategoryId] = useState(question?.categoryId || "");
  const [content, setContent] = useState(question?.content || "");
  const [answer, setAnswer] = useState(question?.answer || "");
  const [status, setStatus] = useState(question?.status || "draft");
  const [draftStatus, setDraftStatus] = useState<"saving" | "saved" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }
  const [publishing, setPublishing] = useState(false);
  const isNew = !question;

  const savingRef = useRef(false);
  const stateRef = useRef({ title, categoryId, content, answer, questionId, status });
  stateRef.current = { title, categoryId, content, answer, questionId, status };

  const saveDraft = useCallback(async (opts?: { silent?: boolean }) => {
    const s = stateRef.current;
    if (!s.title || !s.categoryId || savingRef.current) return;
    savingRef.current = true;
    setDraftStatus("saving");
    try {
      if (!s.questionId) {
        const res = await fetch("/api/admin/questions", {
          method: "POST",
          body: JSON.stringify({ title: s.title, categoryId: Number(s.categoryId), content: s.content, answer: s.answer, status: s.status }),
        });
        if (res.ok) {
          const saved = await res.json();
          setQuestionId(saved.id);
          window.history.replaceState(null, "", `/admin/questions/${saved.id}`);
          setDraftStatus("saved");
          if (!opts?.silent) showToast("已保存");
        }
      } else {
        await fetch(`/api/admin/questions/${s.questionId}`, {
          method: "PUT",
          body: JSON.stringify({ title: s.title, categoryId: Number(s.categoryId), content: s.content, answer: s.answer, status: s.status }),
        });
        setDraftStatus("saved");
        if (!opts?.silent) showToast("已保存");
      }
    } catch {
      setDraftStatus(null);
    }
    savingRef.current = false;
  }, []);

  // Auto-save draft with 3-second debounce
  useEffect(() => {
    if (!title || !categoryId) return;
    const timer = setTimeout(() => saveDraft({ silent: true }), 3000);
    return () => clearTimeout(timer);
  }, [title, categoryId, content, answer, questionId, saveDraft]);

  // Ctrl+S / Cmd+S manual save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [saveDraft]);

  async function publish() {
    setPublishing(true);
    const payload = { title, categoryId: Number(categoryId), content, answer, status: "published" };
    if (questionId) {
      await fetch(`/api/admin/questions/${questionId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      const res = await fetch("/api/admin/questions", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) {
        const saved = await res.json();
        setQuestionId(saved.id);
      }
    }
    router.push("/admin/questions");
  }

  const isDraft = status === "draft" || isNew;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/admin/questions" className="text-sm text-muted-foreground hover:text-primary">
            &larr; 返回题目列表
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {questionId && (
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              {draftStatus === "saving" ? (
                "保存中..."
              ) : draftStatus === "saved" ? (
                <>
                  草稿已保存
                  <button
                    type="button"
                    onClick={() => saveDraft()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs hover:bg-muted transition-colors"
                    title="快捷键: Ctrl+S"
                  >
                    <Save className="w-3 h-3" />
                    保存
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => saveDraft()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs hover:bg-muted transition-colors"
                  title="快捷键: Ctrl+S"
                >
                  <Save className="w-3 h-3" />
                  保存
                </button>
              )}
            </span>
          )}
          {isDraft && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">草稿</span>
          )}
          {!isDraft && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已发布</span>
          )}
          <button
            type="button"
            onClick={publish}
            disabled={publishing}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {publishing ? "处理中..." : "发布"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="题目标题"
          required
          className="w-full border rounded-md px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">选择分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div>
          <label className="block text-sm font-medium mb-1">题目内容</label>
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">参考答案</label>
          <TipTapEditor content={answer} onChange={setAnswer} />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-md text-sm shadow-lg transition-opacity duration-200">
          {toast}
        </div>
      )}
    </div>
  );
}
