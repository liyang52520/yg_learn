"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          {user.name?.[0]}
        </div>
        {user.name}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50 py-1">
          <Link href="/stats" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>统计</Link>
          {(user as any).role === "ADMIN" && (
            <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>管理后台</Link>
          )}
          <hr className="my-1" />
          <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted">退出登录</button>
        </div>
      )}
    </div>
  );
}
