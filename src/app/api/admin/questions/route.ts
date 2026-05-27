import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const question = await prisma.question.create({ data });
  return NextResponse.json(question);
}
