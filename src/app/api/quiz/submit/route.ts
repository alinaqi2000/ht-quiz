import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoring";
import { submitAttemptSchema } from "@/schemas/attempt.schema";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = submitAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { attemptId, answers } = parsed.data;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: { select: { id: true, correctAnswer: true } },
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.isComplete) {
    const score = attempt.score ?? 0;
    const totalPoints = attempt.totalPoints ?? 0;
    return NextResponse.json({
      score,
      totalPoints,
      percentage: totalPoints ? Math.round((score / totalPoints) * 100) : 0,
      alreadySubmitted: true,
    });
  }

  const { score, totalPoints, percentage } = calculateScore(
    answers,
    attempt.quiz.questions
  );

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      answers: JSON.stringify(answers),
      score,
      totalPoints,
      submittedAt: new Date(),
      isComplete: true,
    },
  });

  return NextResponse.json({ score, totalPoints, percentage });
}
