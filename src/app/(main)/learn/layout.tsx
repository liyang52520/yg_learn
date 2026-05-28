import { prisma } from "@/lib/prisma";
import { LearnSidebar } from "@/components/learn/LearnSidebar";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const categories = await prisma.articleCategory.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <LearnSidebar categories={categories} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
