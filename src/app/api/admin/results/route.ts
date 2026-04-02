import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = await prisma.quizAttempt.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      quiz: { select: { id: true, title: true, durationMin: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(attempts);
}
