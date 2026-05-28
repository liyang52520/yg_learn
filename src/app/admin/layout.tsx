import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-card p-4 space-y-2">
        <h2 className="font-bold text-lg mb-4">管理后台</h2>
        <Link href="/admin" className="block text-sm py-1 hover:text-primary">概览</Link>
        <Link href="/admin/users" className="block text-sm py-1 hover:text-primary">用户管理</Link>
        <div className="text-sm font-medium text-muted-foreground mt-4 mb-1">文章管理</div>
        <Link href="/admin/articles/categories" className="block text-sm py-1 pl-2 hover:text-primary">文章分类</Link>
        <Link href="/admin/articles" className="block text-sm py-1 pl-2 hover:text-primary">文章列表</Link>
        <div className="text-sm font-medium text-muted-foreground mt-4 mb-1">题目管理</div>
        <Link href="/admin/questions/categories" className="block text-sm py-1 pl-2 hover:text-primary">题目分类</Link>
        <Link href="/admin/questions" className="block text-sm py-1 pl-2 hover:text-primary">题目列表</Link>
        <div className="pt-4 mt-4 border-t space-y-1">
          <Link href="/admin/backup" className="block text-sm py-1 hover:text-primary">备份与恢复</Link>
          <Link href="/" className="block text-sm py-1 text-muted-foreground hover:text-foreground">← 返回前台</Link>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
