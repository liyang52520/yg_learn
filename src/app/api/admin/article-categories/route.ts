import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const category = await prisma.articleCategory.create({ data });
  return NextResponse.json(category);
}
