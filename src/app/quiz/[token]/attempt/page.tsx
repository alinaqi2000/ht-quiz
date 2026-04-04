export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { QuizShell } from "@/components/quiz/quiz-shell";

export default async function QuizAttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ uid?: string }>;
}) {
  const { token } = await params;
  const { uid } = await searchParams;

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

  const session = await auth();

  let attempt;

  if (quizLink.linkType === "PRIVATE" && quizLink.userId) {
    attempt = await prisma.quizAttempt.findUnique({
      where: { userId_quizId: { userId: quizLink.userId, quizId: quizLink.quizId } },
    });
  } else if (quizLink.linkType === "INTERNAL" && uid) {
    // Internal link: userId passed via query param from the entry page
    attempt = await prisma.quizAttempt.findUnique({
      where: { userId_quizId: { userId: uid, quizId: quizLink.quizId } },
    });
  } else {
    // Public — find attempt by session user, or most recent incomplete
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
    redirect(`/quiz/${token}`);
  }

  if (attempt.isComplete) {
    redirect(`/quiz/${token}/already-submitted`);
  }

  const quiz = quizLink.quiz;

  // Reorder questions by stored questionOrder
  let questions = quiz.questions;
  if (attempt.questionOrder) {
    try {
      const order: string[] = JSON.parse(attempt.questionOrder);
      const qMap = new Map(questions.map((q) => [q.id, q]));
      const reordered = order.map((id) => qMap.get(id)).filter(Boolean) as typeof questions;
      const inOrder = new Set(order);
      const extras = questions.filter((q) => !inOrder.has(q.id));
      questions = [...reordered, ...extras];
    } catch {}
  }

  return (
    <QuizShell
      attempt={{
        id: attempt.id,
        userId: attempt.userId,
        startedAt: attempt.startedAt.toISOString(),
        answers: JSON.parse(attempt.answers || "{}") as Record<string, string>,
        isComplete: attempt.isComplete,
      }}
      quiz={{
        id: quiz.id,
        title: quiz.title,
        durationMin: quiz.durationMin,
      }}
      questions={questions}
      token={token}
    />
  );
}
