"use client";

import { useState, useRef } from "react";

export function SectionExportImport({
  exportUrl,
  importUrl,
  label,
}: {
  exportUrl: string;
  importUrl: string;
  label: string;
}) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setResult(null);
    const res = await fetch(exportUrl, { method: "POST" });
    if (!res.ok) {
      setResult({ ok: false, msg: "导出失败" });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const disposition = res.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?(.+?)"?$/);
    const filename = match?.[1] || `${label}-${new Date().toISOString().split("T")[0]}.zip`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setResult({ ok: true, msg: "导出成功（含图片）" });
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!window.confirm(`从 "${f.name}" 导入${label}数据？将替换当前所有${label}及分类。`)) {
      e.target.value = "";
      return;
    }

    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch(importUrl, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "导入失败");

      const counts = Object.entries(data.imported as Record<string, number>)
        .filter(([, c]) => c > 0)
        .map(([key, count]) => `${key}: ${count} 条`)
        .join("，");
      const uploadMsg = data.restoredUploads > 0 ? `，图片 ${data.restoredUploads} 个` : "";
      setResult({ ok: true, msg: `导入成功！${counts}${uploadMsg}` });
      window.location.reload();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "导入失败" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted"
      >
        导出
      </button>

      <label className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted cursor-pointer">
        {importing ? "导入中..." : "导入"}
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.json"
          className="hidden"
          disabled={importing}
          onChange={handleFileSelected}
        />
      </label>

      {result && (
        <span className={`text-xs ${result.ok ? "text-green-600" : "text-red-500"}`}>
          {result.msg}
        </span>
      )}
    </div>
  );
}
