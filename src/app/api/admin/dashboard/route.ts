import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalUsers, totalQuizzes, totalAttempts, recentAttempts] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.quiz.count(),
      prisma.quizAttempt.count({ where: { isComplete: true } }),
      prisma.quizAttempt.findMany({
        where: { isComplete: true },
        include: {
          user: { select: { name: true, email: true } },
          quiz: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
    ]);

  const quizStats = await prisma.quiz.findMany({
    include: {
      _count: { select: { attempts: { where: { isComplete: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    totalUsers,
    totalQuizzes,
    totalAttempts,
    recentAttempts,
    quizStats,
  });
}
