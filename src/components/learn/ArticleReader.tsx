"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";

type Highlight = { id: number; startOffset: number; endOffset: number; text: string; note: string | null };

function processContent(html: string) {
  let counter = 0;
  const toc: { id: string; text: string; level: number }[] = [];
  const modified = html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (_match, level, attrs, text) => {
    const id = `heading-${counter}`;
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    toc.push({ id, text: cleanText, level: parseInt(level) });
    counter++;
    return `<h${level}${attrs ? " " + attrs : ""} id="${id}">${text}</h${level}>`;
  });
  return { modified, toc };
}

export function ArticleReader({ article, highlights: initialHighlights, userId, prevArticle, nextArticle }: {
  article: any;
  highlights: Highlight[];
  userId: number;
  prevArticle: { id: number; title: string } | null;
  nextArticle: { id: number; title: string } | null;
}) {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [popup, setPopup] = useState<{ x: number; y: number; startOffset: number; endOffset: number; text: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);

  const { modified, toc: tocItems } = useMemo(() => processContent(article.content), [article.content]);
  const sanitizedContent = useMemo(() => DOMPurify.sanitize(modified), [modified]);

  const scrollToHeading = useCallback((id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll("h2, h3");
      for (const h of headings) {
        if (h.textContent?.trim() === text) { h.scrollIntoView({ behavior: "smooth" }); break; }
      }
    }
  }, []);

  const getTextOffsets = useCallback(() => {
    const el = contentRef.current;
    if (!el) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const text = sel.toString();
    if (!text.trim()) return null;

    const fullText = el.textContent || "";
    const startOffset = fullText.indexOf(text);
    if (startOffset === -1) return null;
    return { startOffset, endOffset: startOffset + text.length, text };
  }, []);

  const handleMouseUp = useCallback(() => {
    const offsets = getTextOffsets();
    if (!offsets) { setPopup(null); return; }
    const sel = window.getSelection();
    if (!sel) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setPopup({ ...offsets, x: rect.left, y: rect.bottom + window.scrollY + 4 });
  }, [getTextOffsets]);

  async function saveHighlight() {
    if (!popup) return;
    const res = await fetch("/api/highlights", {
      method: "POST",
      body: JSON.stringify({ articleId: article.id, ...popup, note: noteText }),
    });
    const h = await res.json();
    setHighlights([h, ...highlights]);
    setPopup(null);
    setNoteText("");
  }

  async function deleteHighlight(id: number) {
    await fetch(`/api/highlights/${id}`, { method: "DELETE" });
    setHighlights(highlights.filter((h) => h.id !== id));
  }

  async function updateNote(id: number, note: string) {
    await fetch(`/api/highlights/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
    setHighlights(highlights.map((h) => (h.id === id ? { ...h, note } : h)));
    setEditingNote(null);
  }

  function renderContent() {
    if (highlights.length === 0) return sanitizedContent;
    const el = contentRef.current;
    if (!el) return sanitizedContent;
    const fullText = el.textContent || "";
    const parts: { text: string; highlighted: boolean; note?: string }[] = [];
    let lastIndex = 0;

    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
    for (const h of sorted) {
      if (h.startOffset > lastIndex) parts.push({ text: fullText.slice(lastIndex, h.startOffset), highlighted: false });
      parts.push({ text: fullText.slice(h.startOffset, h.endOffset), highlighted: true, note: h.note || undefined });
      lastIndex = h.endOffset;
    }
    if (lastIndex < fullText.length) parts.push({ text: fullText.slice(lastIndex), highlighted: false });

    return parts.map((p, i) => {
      if (p.highlighted) return `<mark data-highlight="${i}" class="bg-yellow-200 rounded px-0.5 cursor-pointer" title="${p.note || ""}">${p.text}</mark>`;
      return p.text;
    }).join("");
  }

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = renderContent();
    }
  }, [highlights]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex gap-8">
        <div className="flex-1 min-w-0 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">{article.title}</h1>
          <div
            ref={contentRef}
            className="prose prose-lg max-w-none"
            onMouseUp={handleMouseUp}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {popup && (
            <div
              className="fixed z-50 bg-card border rounded-lg shadow-lg p-3 w-80"
              style={{ left: Math.min(popup.x, window.innerWidth - 320), top: popup.y }}
            >
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">&ldquo;{popup.text}&rdquo;</p>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="写点笔记..."
                className="w-full border rounded-md p-2 text-sm min-h-[60px]"
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button onClick={() => setPopup(null)} className="text-xs px-3 py-1 border rounded-md">取消</button>
                <button onClick={saveHighlight} className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md">保存</button>
              </div>
            </div>
          )}

          {highlights.length > 0 && (
            <div className="mt-8 border-t pt-4">
              <h2 className="font-semibold mb-3">我的笔记 ({highlights.length})</h2>
              <div className="space-y-3">
                {highlights.map((h) => (
                  <div key={h.id} className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground mb-1">&ldquo;{h.text}&rdquo;</p>
                    {editingNote === h.id ? (
                      <div>
                        <textarea
                          defaultValue={h.note || ""}
                          className="w-full border rounded-md p-2 text-sm min-h-[60px]"
                          id={`note-${h.id}`}
                        />
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => {
                            const el = document.getElementById(`note-${h.id}`) as HTMLTextAreaElement;
                            updateNote(h.id, el.value);
                          }} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">保存</button>
                          <button onClick={() => setEditingNote(null)} className="text-xs px-2 py-1 border rounded">取消</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{h.note || <span className="text-muted-foreground italic">无笔记</span>}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingNote(h.id)} className="text-xs text-primary">编辑</button>
                      <button onClick={() => deleteHighlight(h.id)} className="text-xs text-red-500">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prev / Next */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <div>
              {prevArticle ? (
                <Link href={`/learn/articles/${prevArticle.id}`} className="text-sm text-muted-foreground hover:text-primary block max-w-[200px]">
                  <span className="text-xs block">← 上一篇</span>
                  <span className="line-clamp-1">{prevArticle.title}</span>
                </Link>
              ) : <span />}
            </div>
            <div className="text-right">
              {nextArticle ? (
                <Link href={`/learn/articles/${nextArticle.id}`} className="text-sm text-muted-foreground hover:text-primary block max-w-[200px]">
                  <span className="text-xs block">下一篇 →</span>
                  <span className="line-clamp-1">{nextArticle.title}</span>
                </Link>
              ) : <span />}
            </div>
          </div>
        </div>

        {tocItems.length > 0 && (
          <aside className="w-48 shrink-0 hidden lg:block">
            <div className="sticky top-6 space-y-1">
              <h3 className="text-sm font-semibold mb-2">目录</h3>
              <nav className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-0.5">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id, item.text)}
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
    </div>
  );
}
