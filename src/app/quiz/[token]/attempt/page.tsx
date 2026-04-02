export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { QuizShell } from "@/components/quiz/quiz-shell";

export default async function QuizAttemptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quizLink = await prisma.quizLink.findUnique({
    where: { token },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              difficulty: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!quizLink) notFound();

  if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
    redirect(`/quiz/${token}`);
  }

  // Find attempt: for private links use the linked userId directly.
  // For public links, find the most recent incomplete attempt for this quiz.
  let attempt;

  if (quizLink.userId) {
    attempt = await prisma.quizAttempt.findUnique({
      where: { userId_quizId: { userId: quizLink.userId, quizId: quizLink.quizId } },
    });
  } else {
    // Public quiz — find the latest incomplete attempt (user just created it via POST)
    const session = await auth();
    if (session?.user?.id) {
      attempt = await prisma.quizAttempt.findUnique({
        where: { userId_quizId: { userId: session.user.id, quizId: quizLink.quizId } },
      });
    }
    if (!attempt) {
      attempt = await prisma.quizAttempt.findFirst({
        where: { quizId: quizLink.quizId, isComplete: false },
        orderBy: { startedAt: "desc" },
      });
    }
  }

  if (!attempt) {
    // No attempt started yet — redirect to entry
    redirect(`/quiz/${token}`);
  }

  const quiz = quizLink.quiz;

  return (
    <QuizShell
      attempt={{
        id: attempt.id,
        startedAt: attempt.startedAt.toISOString(),
        answers: JSON.parse(attempt.answers || "{}") as Record<string, string>,
        isComplete: attempt.isComplete,
      }}
      quiz={{
        id: quiz.id,
        title: quiz.title,
        durationMin: quiz.durationMin,
      }}
      questions={quiz.questions}
    />
  );
}
