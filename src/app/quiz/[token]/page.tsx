export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { QuizEntryClient } from "./quiz-entry-client";

export default async function QuizEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quizLink = await prisma.quizLink.findUnique({
    where: { token },
    include: {
      quiz: {
        include: { _count: { select: { questions: true } } },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!quizLink) notFound();

  if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">Link Expired</h1>
          <p className="text-zinc-400">This quiz link has expired.</p>
        </div>
      </div>
    );
  }

  const session = await auth();

  // Check if already submitted
  if (session?.user?.id) {
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quizLink.quizId,
        },
      },
    });

    if (existingAttempt?.isComplete) {
      redirect(`/quiz/${token}/already-submitted`);
    }

    // If incomplete attempt exists and it's a private link, go to attempt
    if (existingAttempt && !existingAttempt.isComplete) {
      redirect(`/quiz/${token}/attempt`);
    }
  }

  // For private quizzes, if linked user matches session, redirect to attempt
  if (quizLink.userId && session?.user?.id === quizLink.userId) {
    if (!quizLink.used) {
      redirect(`/quiz/${token}/attempt`);
    }
  }

  const groupLeaders = await prisma.user.findMany({
    where: { isGroupLeader: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <QuizEntryClient
      token={token}
      quiz={JSON.parse(JSON.stringify(quizLink.quiz))}
      linkedUser={quizLink.user ? JSON.parse(JSON.stringify(quizLink.user)) : null}
      isPrivate={!!quizLink.userId}
      alreadyUsed={quizLink.used}
      groupLeaders={groupLeaders}
      sessionUserId={session?.user?.id}
    />
  );
}
