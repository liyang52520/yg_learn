"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { TipTapEditor } from "./TipTapEditor";
import { ProseContent } from "@/components/shared/ProseContent";
import { Save } from "lucide-react";

function extractToc(html: string) {
  const toc: { id: string; text: string; level: number }[] = [];
  let counter = 0;
  const regex = /<h([23])(?:[^>]*)>(.*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const cleanText = match[2].replace(/<[^>]*>/g, "").trim();
    if (cleanText) {
      toc.push({ id: `editor-heading-${counter}`, text: cleanText, level: parseInt(match[1]) });
      counter++;
    }
  }
  return toc;
}

export function ArticleForm({ article, categories }: { article: any; categories: any[] }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<number | null>(article?.id || null);
  const [title, setTitle] = useState(article?.title || "");
  const [summary, setSummary] = useState(article?.summary || "");
  const [categoryId, setCategoryId] = useState(article?.categoryId || "");
  const [content, setContent] = useState(article?.content || "");
  const [status, setStatus] = useState(article?.status || "draft");
  const [draftStatus, setDraftStatus] = useState<"saving" | "saved" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isNew = !article;

  const tocItems = extractToc(content);
  const savingRef = useRef(false);
  const stateRef = useRef({ title, summary, categoryId, content, articleId, status });
  stateRef.current = { title, summary, categoryId, content, articleId, status };

  const saveDraft = useCallback(async (opts?: { silent?: boolean }) => {
    const s = stateRef.current;
    if (!s.title || !s.categoryId || savingRef.current) return;
    savingRef.current = true;
    setDraftStatus("saving");
    try {
      if (!s.articleId) {
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          body: JSON.stringify({ title: s.title, summary: s.summary || null, categoryId: Number(s.categoryId), content: s.content, status: s.status }),
        });
        if (res.ok) {
          const saved = await res.json();
          setArticleId(saved.id);
          window.history.replaceState(null, "", `/admin/articles/${saved.id}`);
          setDraftStatus("saved");
          if (!opts?.silent) showToast("已保存");
        }
      } else {
        await fetch(`/api/admin/articles/${s.articleId}`, {
          method: "PUT",
          body: JSON.stringify({ title: s.title, summary: s.summary || null, categoryId: Number(s.categoryId), content: s.content, status: s.status }),
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
  }, [title, summary, categoryId, content, articleId, saveDraft]);

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
    const payload = { title, summary: summary || null, categoryId: Number(categoryId), content, status: "published" };
    if (articleId) {
      await fetch(`/api/admin/articles/${articleId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      const res = await fetch("/api/admin/articles", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) {
        const saved = await res.json();
        setArticleId(saved.id);
      }
    }
    router.push("/admin/articles");
  }

  const scrollToHeading = useCallback(
    (text: string) => {
      if (!editorContainerRef.current) return;
      const headings = editorContainerRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
      for (const h of headings) {
        if (h.textContent?.trim() === text) {
          h.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    },
    [],
  );

  const isDraft = status === "draft" || isNew;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/admin/articles" className="text-sm text-muted-foreground hover:text-primary">
            &larr; 返回文章列表
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {articleId && (
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
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
          >
            {showPreview ? "编辑" : "预览"}
          </button>
        </div>
      </div>

      {showPreview && articleId ? (
        <div className="border rounded-md p-6">
          <h1 className="text-3xl font-bold mb-6">{title}</h1>
          {summary && (
            <p className="text-muted-foreground text-sm mb-6 italic border-l-2 pl-4">{summary}</p>
          )}
          <ProseContent html={content} />
        </div>
      ) : (
        <div className="flex gap-6 mx-auto max-w-6xl w-full">
          <div className="flex-1 min-w-0 max-w-4xl space-y-4">
            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              required
              className="w-full border rounded-md px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            {/* Summary + Category row */}
            <div className="flex gap-3">
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="文章摘要（可选，显示在文章列表和文章顶部）"
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-40 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">选择分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editor */}
            <div ref={editorContainerRef}>
              <TipTapEditor content={content} onChange={setContent} />
            </div>

          </div>

          {/* TOC sidebar */}
          {tocItems.length > 0 && (
            <aside className="w-48 shrink-0 hidden lg:block">
              <div className="sticky top-6 space-y-1">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">目录</h3>
                <nav className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-0.5">
                  {tocItems.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollToHeading(item.text)}
                      className={`block text-left text-sm w-full hover:text-primary transition-colors ${
                        item.level === 3 ? "pl-4 text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-md text-sm shadow-lg transition-opacity duration-200">
          {toast}
        </div>
      )}
    </div>
  );
}
