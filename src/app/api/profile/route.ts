import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);

  const { dailyNewLimit, categoryIds } = await req.json();

  if (typeof dailyNewLimit !== "number" || dailyNewLimit < 1 || dailyNewLimit > 50) {
    return NextResponse.json({ error: "dailyNewLimit must be between 1 and 50" }, { status: 400 });
  }
  if (!Array.isArray(categoryIds)) {
    return NextResponse.json({ error: "categoryIds must be an array" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { dailyNewLimit },
    }),
    prisma.userSelectedCategory.deleteMany({ where: { userId } }),
    ...(categoryIds.length > 0
      ? [
          prisma.userSelectedCategory.createMany({
            data: categoryIds.map((categoryId: number) => ({ userId, categoryId })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ success: true });
}
