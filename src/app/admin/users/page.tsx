import { prisma } from "@/lib/prisma";
import { UserActions } from "@/components/admin/UserActions";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
      <table className="w-full border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3">ID</th>
            <th className="text-left p-3">用户名</th>
            <th className="text-left p-3">邮箱</th>
            <th className="text-left p-3">角色</th>
            <th className="text-left p-3">状态</th>
            <th className="text-left p-3">注册时间</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-3">{u.id}</td>
              <td className="p-3">{u.name}</td>
              <td className="p-3 text-muted-foreground">{u.email}</td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                  {u.role === "ADMIN" ? "管理员" : "用户"}
                </span>
              </td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded ${u.disabled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {u.disabled ? "禁用" : "正常"}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="p-3">
                <UserActions userId={u.id} currentRole={u.role} disabled={u.disabled} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
