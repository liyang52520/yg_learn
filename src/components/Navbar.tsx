import { auth } from "@/lib/auth";
import { UserMenu } from "./UserMenu";
import Link from "next/link";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg">LearnHub</Link>
          <div className="flex gap-4">
            <Link href="/learn" className="text-sm font-medium text-muted-foreground hover:text-foreground">学习</Link>
            <Link href="/quiz" className="text-sm font-medium text-muted-foreground hover:text-foreground">刷题</Link>
          </div>
        </div>
        <UserMenu user={user} />
      </div>
    </nav>
  );
}
