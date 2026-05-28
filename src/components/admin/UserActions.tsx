"use client";

import { useRouter } from "next/navigation";

export function UserActions({ userId, currentRole, disabled }: { userId: number; currentRole: string; disabled: boolean }) {
  const router = useRouter();

  async function toggleRole() {
    await fetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId, role: currentRole === "ADMIN" ? "USER" : "ADMIN" }),
    });
    router.refresh();
  }

  async function toggleDisabled() {
    await fetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ userId, disabled: !disabled }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button onClick={toggleRole} className="text-xs px-2 py-1 border rounded hover:bg-muted">
        切换角色
      </button>
      <button onClick={toggleDisabled} className={`text-xs px-2 py-1 border rounded hover:bg-muted ${disabled ? "text-green-500" : "text-red-500"}`}>
        {disabled ? "启用" : "禁用"}
      </button>
    </div>
  );
}
