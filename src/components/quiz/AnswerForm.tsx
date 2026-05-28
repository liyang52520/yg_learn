"use client";

import DOMPurify from "dompurify";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnswerForm({
  question, progress, isBookmarked: initBookmarked, notes: initNotes, userId, prevId, nextId, questionIds,
}: any) {
  const router = useRouter();
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(initBookmarked);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(initNotes);

  async function handleSubmit() {
    setSubmitted(true);
  }

  async function handleScore(s: number) {
    setScore(s);
    const res = await fetch("/api/progress", {
      method: "POST",
      body: JSON.stringify({ questionId: question.id, score: s }),
    });
    if (res.status === 429) {
      const data = await res.json();
      alert(data.error);
      setScore(null);
      return;
    }
    const questionMode = progress ? "review" : "learn";
    await fetch("/api/daily-record", {
      method: "POST",
      body: JSON.stringify({ questionId: question.id, score: s, mode: questionMode }),
    });
  }

  async function toggleBookmark() {
    const res = await fetch("/api/bookmarks", {
      method: isBookmarked ? "DELETE" : "POST",
      body: JSON.stringify({ questionId: question.id }),
    });
    if (res.ok) setIsBookmarked(!isBookmarked);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const res = await fetch("/api/question-notes", {
      method: "POST",
      body: JSON.stringify({ questionId: question.id, content: noteText }),
    });
    const note = await res.json();
    setNotes([note, ...notes]);
    setNoteText("");
    setShowNoteInput(false);
  }

  async function deleteNote(id: number) {
    await fetch(`/api/question-notes/${id}`, { method: "DELETE" });
    setNotes(notes.filter((n: any) => n.id !== id));
  }

  const sanitizedContent = DOMPurify.sanitize(question.content);
  const sanitizedAnswer = DOMPurify.sanitize(question.answer);

  function goToQuestion(id: number) {
    const params = new URLSearchParams();
    params.set("ids", questionIds.join(","));
    router.push(`/quiz/${id}?${params.toString()}`);
  }

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="bg-muted px-2 py-0.5 rounded">{question.category.name}</span>
        <span className="bg-muted px-2 py-0.5 rounded">{progress ? "复习" : "新题"}</span>
        {progress && <span>复习次数: {progress.repetitions}</span>}
      </div>

      <div className="prose prose-lg max-w-none mb-6" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

      <textarea
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="输入你的答案..."
        className="w-full border rounded-md p-4 min-h-[120px]"
        disabled={submitted}
      />

      {!submitted && (
        <button onClick={handleSubmit} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-md">提交答案</button>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={toggleBookmark} className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted">
          {isBookmarked ? "已收藏" : "收藏"}
        </button>
        <button onClick={() => setShowNoteInput(!showNoteInput)} className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted">
          添加笔记
        </button>
      </div>

      {showNoteInput && (
        <div className="flex gap-2 mt-2">
          <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="写笔记..." className="flex-1 border rounded-md px-3 py-2 text-sm" />
          <button onClick={addNote} className="bg-primary text-primary-foreground px-4 rounded-md text-sm">保存</button>
        </div>
      )}

      {notes.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">我的笔记</h3>
          <div className="space-y-2">
            {notes.map((n: any) => (
              <div key={n.id} className="bg-muted/30 border rounded-lg p-3">
                <p className="text-sm">{n.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                  <button onClick={() => deleteNote(n.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitted && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">参考答案</h3>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedAnswer }} />
          </div>

          <div>
            <h3 className="font-semibold mb-2">自评</h3>
            <div className="flex gap-2">
              {[
                { v: 0, label: "完全忘记" },
                { v: 1, label: "很模糊" },
                { v: 2, label: "有点困难" },
                { v: 3, label: "答对了" },
                { v: 4, label: "轻松" },
                { v: 5, label: "非常轻松" },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => handleScore(v)}
                  disabled={score !== null}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    score === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t">
        <div>
          {prevId && (
            <button onClick={() => goToQuestion(prevId)} className="text-sm px-4 py-2 border rounded-md hover:bg-muted">
              上一题
            </button>
          )}
        </div>
        <div className="text-sm text-muted-foreground self-center">
          {questionIds.indexOf(question.id) + 1} / {questionIds.length}
        </div>
        <div>
          {nextId && (
            <button onClick={() => goToQuestion(nextId)} className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md">
              下一题
            </button>
          )}
          {!nextId && (
            <button onClick={() => router.push("/")} className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md">
              完成
            </button>
          )}
        </div>
      </div>
    </>
  );
}
