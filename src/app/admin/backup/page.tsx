"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
  stats: Record<string, number>;
}

interface AutoConfig {
  enabled: boolean;
  frequency: string;
  lastRun: string | null;
}

export default function AdminBackupPage() {
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [autoConfig, setAutoConfig] = useState<AutoConfig | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    const res = await fetch("/api/admin/backup/list");
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files || []);
      setAutoConfig(data.autoConfig || null);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function handleExport() {
    setExporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/backup/export", { method: "POST" });
      if (!res.ok) throw new Error("导出失败");
      await fetchFiles();
      setResult({ type: "success", message: "备份文件已保存到服务器（含图片）" });
    } catch {
      setResult({ type: "error", message: "导出失败，请重试" });
    } finally {
      setExporting(false);
    }
  }

  async function handleDownload(filename: string) {
    const res = await fetch("/api/admin/backup/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleRestore(filename: string) {
    if (!window.confirm(`确定从 "${filename}" 恢复数据？这将清空所有现有数据，不可撤销！`)) return;

    setRestoring(filename);
    setResult(null);
    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "恢复失败");

      const parts: string[] = [];
      if (data.imported) {
        const counts = Object.entries(data.imported as Record<string, number>)
          .filter(([, c]) => c > 0)
          .map(([key, count]) => `${key}: ${count} 条`);
        parts.push(...counts);
      }
      if (data.restoredUploads > 0) {
        parts.push(`图片: ${data.restoredUploads} 个`);
      }
      setResult({ type: "success", message: `恢复成功！${parts.join("，")}` });
      await fetchFiles();
    } catch (err) {
      setResult({ type: "error", message: err instanceof Error ? err.message : "恢复失败" });
    } finally {
      setRestoring(null);
    }
  }

  async function handleDelete(filename: string) {
    if (!window.confirm(`确定删除 "${filename}"？`)) return;

    setDeleting(filename);
    setResult(null);
    try {
      const res = await fetch("/api/admin/backup/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) throw new Error("删除失败");
      setResult({ type: "success", message: "备份文件已删除" });
      await fetchFiles();
    } catch (err) {
      setResult({ type: "error", message: err instanceof Error ? err.message : "删除失败" });
    } finally {
      setDeleting(null);
    }
  }

  async function handleUploadImport() {
    if (!uploadFile) return;
    if (!window.confirm("这将清空所有现有数据并恢复备份，确定继续？")) return;

    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch("/api/admin/backup/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "恢复失败");

      const parts: string[] = [];
      if (data.imported) {
        const counts = Object.entries(data.imported as Record<string, number>)
          .filter(([, c]) => c > 0)
          .map(([key, count]) => `${key}: ${count} 条`);
        parts.push(...counts);
      }
      if (data.restoredUploads > 0) {
        parts.push(`图片: ${data.restoredUploads} 个`);
      }
      setResult({ type: "success", message: `恢复成功！${parts.join("，")}` });
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await fetchFiles();
    } catch (err) {
      setResult({ type: "error", message: err instanceof Error ? err.message : "恢复失败" });
    } finally {
      setImporting(false);
    }
  }

  async function handleAutoBackupToggle() {
    if (!autoConfig) return;
    const newEnabled = !autoConfig.enabled;
    const res = await fetch("/api/admin/backup/auto", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newEnabled }),
    });
    if (res.ok) {
      setAutoConfig({ ...autoConfig, enabled: newEnabled });
      if (newEnabled) {
        const backupRes = await fetch("/api/admin/backup/auto");
        if (backupRes.ok) {
          setResult({ type: "success", message: "自动备份已启用，首次备份已完成（含图片）" });
          await fetchFiles();
        }
      } else {
        setResult({ type: "success", message: "自动备份已关闭" });
      }
    }
  }

  async function handleAutoFrequencyChange(frequency: string) {
    if (!autoConfig) return;
    const res = await fetch("/api/admin/backup/auto", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frequency }),
    });
    if (res.ok) {
      setAutoConfig({ ...autoConfig, frequency });
      setResult({ type: "success", message: `备份频率已设置为 ${frequencyLabels[frequency]}` });
    }
  }

  const frequencyLabels: Record<string, string> = {
    hourly: "每小时",
    daily: "每天",
    weekly: "每周",
  };

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("zh-CN");
  }

  function getTotalStats(file: BackupFile) {
    const vals = Object.values(file.stats);
    return vals.reduce((s, v) => s + v, 0);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">备份与恢复</h1>

      {/* Export & Auto-backup section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">手动备份</h2>
          <p className="text-xs text-muted-foreground mb-3">立即备份所有数据（含图片）到服务器</p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? "备份中..." : "立即备份"}
          </button>
        </div>

        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">自动备份</h2>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleAutoBackupToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoConfig?.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoConfig?.enabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm">{autoConfig?.enabled ? "已启用" : "已关闭"}</span>
          </div>
          {autoConfig?.enabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">频率：</span>
              <select
                value={autoConfig.frequency}
                onChange={(e) => handleAutoFrequencyChange(e.target.value)}
                className="border rounded px-2 py-1 text-xs"
              >
                <option value="hourly">每小时</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
              </select>
              {autoConfig.lastRun && (
                <span className="text-xs text-muted-foreground ml-2">
                  上次：{formatDate(autoConfig.lastRun)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="bg-card border rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-3">
          备份文件列表
          {files.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">共 {files.length} 个</span>
          )}
        </h2>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">暂无备份文件</p>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.filename} className="border rounded-lg p-3 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" title={f.filename}>{f.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(f.createdAt)} · {formatSize(f.size)} · 共 {getTotalStats(f)} 条记录
                      {f.stats.uploads > 0 && <span> · 图片 {f.stats.uploads} 个</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => handleDownload(f.filename)}
                      className="text-xs px-3 py-1.5 border rounded-md hover:bg-muted"
                    >
                      下载
                    </button>
                    <button
                      onClick={() => handleRestore(f.filename)}
                      disabled={restoring === f.filename}
                      className="text-xs px-3 py-1.5 border rounded-md text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      {restoring === f.filename ? "恢复中..." : "恢复"}
                    </button>
                    <button
                      onClick={() => handleDelete(f.filename)}
                      disabled={deleting === f.filename}
                      className="text-xs px-3 py-1.5 border rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {deleting === f.filename ? "删除中..." : "删除"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload import */}
      <details className="bg-card border rounded-lg p-5">
        <summary className="text-lg font-semibold cursor-pointer">上传备份文件恢复</summary>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            选择本地的 .zip（含图片）或 .json（仅数据）备份文件上传恢复。
            <strong className="text-red-500 block mt-1">警告：导入将清空所有现有数据，此操作不可撤销！</strong>
          </p>
          <div className="flex items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              accept=".json,.zip"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <button
              onClick={handleUploadImport}
              disabled={!uploadFile || importing}
              className="bg-red-500 text-white px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50"
            >
              {importing ? "恢复中..." : "上传恢复"}
            </button>
          </div>
          {uploadFile && (
            <p className="text-xs text-muted-foreground mt-2">
              已选择：{uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </details>

      {/* Result */}
      {result && (
        <div
          className={`border rounded-lg p-4 text-sm ${
            result.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
