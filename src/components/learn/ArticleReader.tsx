"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

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

export function ArticleReader({
  article, highlights: initialHighlights, userId, prevArticle, nextArticle, category, readingTime,
}: {
  article: any;
  highlights: Highlight[];
  userId: number;
  prevArticle: { id: number; title: string } | null;
  nextArticle: { id: number; title: string } | null;
  category: string | null;
  readingTime: number;
}) {
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [popup, setPopup] = useState<{ x: number; y: number; startOffset: number; endOffset: number; text: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [progress, setProgress] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [notePopup, setNotePopup] = useState<{
    x: number; y: number; text: string;
    notes: { id: number; note: string | null }[];
  } | null>(null);
  const [editingNoteInPopup, setEditingNoteInPopup] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  const { modified, toc: tocItems } = useMemo(() => processContent(article.content), [article.content]);

  const fontSizeClass = fontSize === "sm" ? "prose-base" : fontSize === "lg" ? "prose-2xl" : "prose-lg";

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const viewportBottom = window.innerHeight;
      const articleStart = rect.top + window.scrollY;
      const articleEnd = articleStart + rect.height;
      const scrollPos = window.scrollY + viewportBottom;

      if (scrollPos <= articleStart + 50) { setProgress(0); return; }
      if (scrollPos >= articleEnd - 50) { setProgress(100); return; }

      const scrolled = scrollPos - articleStart - 50;
      const total = rect.height - 100;
      setProgress(Math.min(100, Math.round((scrolled / total) * 100)));
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    if (highlights.length === 0 || !showHighlights) return modified;

    const temp = document.createElement("div");
    temp.innerHTML = modified;

    // Build text node index with cumulative offsets
    const textNodes: { node: Text; start: number }[] = [];
    let offset = 0;
    const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const len = node.textContent?.length || 0;
      if (len > 0) textNodes.push({ node, start: offset });
      offset += len;
    }

    if (textNodes.length === 0) return modified;

    // Sort and merge overlapping highlights to produce non-overlapping ranges
    const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
    const merged: { startOffset: number; endOffset: number; notes: { id: number; note: string | null }[] }[] = [];
    for (const h of sorted) {
      const last = merged[merged.length - 1];
      if (last && h.startOffset <= last.endOffset) {
        last.endOffset = Math.max(last.endOffset, h.endOffset);
        last.notes.push({ id: h.id, note: h.note || null });
      } else {
        merged.push({ startOffset: h.startOffset, endOffset: h.endOffset, notes: [{ id: h.id, note: h.note || null }] });
      }
    }

    // Process from last text node to first
    for (let ti = textNodes.length - 1; ti >= 0; ti--) {
      const tn = textNodes[ti];
      const text = tn.node.textContent || "";
      const nodeEnd = tn.start + text.length;

      // Find merged ranges overlapping this text node, in reverse order
      const overlaps: typeof merged = [];
      for (let hi = merged.length - 1; hi >= 0; hi--) {
        const h = merged[hi];
        if (h.startOffset < nodeEnd && h.endOffset > tn.start) {
          overlaps.push(h);
        }
      }
      if (overlaps.length === 0) continue;

      const parent = tn.node.parentNode;
      if (!parent) continue;

      const parts: Node[] = [];
      let pos = text.length;

      for (const h of overlaps) {
        const localEnd = Math.min(h.endOffset, nodeEnd) - tn.start;
        const localStart = Math.max(h.startOffset, tn.start) - tn.start;

        if (localEnd < pos) {
          parts.unshift(document.createTextNode(text.slice(localEnd, pos)));
        }

        const mark = document.createElement("mark");
        mark.className = "bg-yellow-200 rounded px-0.5 cursor-pointer";
        mark.dataset.notes = JSON.stringify(h.notes);
        mark.textContent = text.slice(localStart, localEnd);
        parts.unshift(mark);

        pos = localStart;
      }

      if (pos > 0) {
        parts.unshift(document.createTextNode(text.slice(0, pos)));
      }

      const frag = document.createDocumentFragment();
      for (const p of parts) frag.appendChild(p);
      parent.replaceChild(frag, tn.node);
    }

    return temp.innerHTML;
  }

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = renderContent();
    }
  }, [highlights, showHighlights]);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      pre.className = (pre.className || "") + " relative rounded-lg text-sm";

      const code = pre.querySelector("code");
      if (code && !code.dataset.highlighted) {
        hljs.highlightElement(code);
        code.dataset.highlighted = "true";
      }

      const btn = document.createElement("button");
      btn.className =
        "copy-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20";
      btn.textContent = "复制";
      btn.onclick = async () => {
        await navigator.clipboard.writeText(code?.textContent || pre.textContent || "");
        btn.textContent = "已复制!";
        setTimeout(() => { btn.textContent = "复制"; }, 2000);
      };
      const wrapper = document.createElement("div");
      wrapper.className = "group relative";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(btn);
    });
  }, [highlights, showHighlights]);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.querySelectorAll("img").forEach((img) => {
      if (img.dataset.lightboxEnabled) return;
      img.dataset.lightboxEnabled = "true";
      img.className = (img.className || "") + " cursor-pointer transition-opacity hover:opacity-80 rounded";
      img.onclick = () => setLightboxImage(img.src);
    });
  }, [highlights, showHighlights]);

  const handleMarkClick = useCallback((e: React.MouseEvent) => {
    const mark = (e.target as HTMLElement).closest("mark");
    if (!mark || !mark.dataset.notes) return;
    const rect = mark.getBoundingClientRect();
    setNotePopup({
      x: rect.left,
      y: rect.bottom + window.scrollY + 4,
      text: mark.textContent || "",
      notes: JSON.parse(mark.dataset.notes),
    });
    setEditingNoteInPopup(null);
    setEditNoteText("");
  }, []);

  // Click/scroll outside popup -> close
  useEffect(() => {
    if (!notePopup) return;
    const handleInteraction = (e: MouseEvent | WheelEvent) => {
      if ((e.target as HTMLElement).closest(".note-popup-panel")) return;
      setNotePopup(null);
    };
    // Delay to avoid the same click that just opened it
    const timer = setTimeout(() => {
      document.addEventListener("click", handleInteraction);
      document.addEventListener("wheel", handleInteraction, { passive: true });
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("wheel", handleInteraction);
    };
  }, [notePopup]);

  const formattedDate = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <>
      <div className="sticky top-0 z-40 h-0.5 bg-muted -mx-6">
        <div className="h-full bg-primary transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 max-w-3xl">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2 flex-wrap">
              {category && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{category}</span>
              )}
              {formattedDate && <span>{formattedDate}</span>}
              {readingTime > 0 && <span>预计阅读 {readingTime} 分钟</span>}

              <button
                onClick={() => setShowHighlights(!showHighlights)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  showHighlights ? "bg-yellow-100 border-yellow-300 text-yellow-800" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {showHighlights ? "标注开" : "标注关"}
              </button>

              <div className="flex items-center gap-0.5 border rounded-md overflow-hidden">
                {[
                  { key: "sm" as const, label: "A", cls: "text-xs" },
                  { key: "md" as const, label: "A", cls: "text-sm" },
                  { key: "lg" as const, label: "A", cls: "text-base" },
                ].map(({ key, label, cls }) => (
                  <button
                    key={key}
                    onClick={() => setFontSize(key)}
                    className={`px-2 py-1 leading-none transition-colors ${cls} ${
                      fontSize === key ? "bg-muted font-medium" : "hover:bg-muted/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-6">{article.title}</h1>

            {article.summary && (
              <p className="text-muted-foreground text-sm mb-6 italic border-l-2 pl-4">{article.summary}</p>
            )}

            <div
              ref={contentRef}
              className={`prose ${fontSizeClass} max-w-none`}
              onMouseUp={handleMouseUp}
              onClick={handleMarkClick}
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

            {notePopup && (
                <div
                  className="note-popup-panel fixed z-50 bg-card border rounded-lg shadow-lg w-80"
                  style={{ left: Math.min(notePopup.x, window.innerWidth - 340), top: notePopup.y }}
                >
                  <div className="p-3 border-b">
                    <p className="text-xs text-muted-foreground line-clamp-2">&ldquo;{notePopup.text}&rdquo;</p>
                  </div>
                  <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                    {notePopup.notes.map((n, i) => (
                      <div key={n.id}>
                        {i > 0 && <hr className="my-2 border-muted" />}
                        {editingNoteInPopup === n.id ? (
                          <div>
                            <textarea
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              className="w-full border rounded-md p-2 text-sm min-h-[60px]"
                            />
                            <div className="flex gap-2 mt-1 justify-end">
                              <button onClick={async () => {
                                await updateNote(n.id, editNoteText);
                                setEditingNoteInPopup(null);
                                setNotePopup(null);
                              }} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">保存</button>
                              <button onClick={() => setEditingNoteInPopup(null)} className="text-xs px-2 py-1 border rounded">取消</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm whitespace-pre-wrap">{n.note || <span className="text-muted-foreground italic">无笔记</span>}</p>
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => {
                                setEditingNoteInPopup(n.id);
                                setEditNoteText(n.note || "");
                              }} className="text-xs text-primary">编辑</button>
                              <button onClick={async () => {
                                await deleteHighlight(n.id);
                                setNotePopup(null);
                              }} className="text-xs text-red-500">删除</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
                <nav className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-0.5 scrollbar-thin">
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

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
