import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const { userId, ...data } = await req.json();
  const user = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json(user);
}
