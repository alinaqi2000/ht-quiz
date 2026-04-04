import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (!attempt.isComplete) {
    return NextResponse.json({ error: "Quiz not yet submitted" }, { status: 403 });
  }

  // Allow access if:
  // 1. The logged-in user owns the attempt
  // 2. Or admin
  const session = await auth();
  const isOwner = session?.user?.id === attempt.userId;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reorder questions by stored questionOrder if available
  let questions = attempt.quiz.questions;
  if (attempt.questionOrder) {
    try {
      const order: string[] = JSON.parse(attempt.questionOrder);
      const qMap = new Map(questions.map((q) => [q.id, q]));
      const reordered = order.map((id) => qMap.get(id)).filter(Boolean) as typeof questions;
      // Append any questions not in order (shouldn't happen but safety net)
      const inOrder = new Set(order);
      const extras = questions.filter((q) => !inOrder.has(q.id));
      questions = [...reordered, ...extras];
    } catch {}
  }

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      answers: JSON.parse(attempt.answers || "{}"),
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      submittedAt: attempt.submittedAt,
    },
    quiz: { id: attempt.quiz.id, title: attempt.quiz.title },
    user: attempt.user,
    questions,
  });
}
