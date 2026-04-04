export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function AlreadySubmittedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const quizLink = await prisma.quizLink.findUnique({
    where: { token },
    include: { quiz: { select: { title: true } } },
  });

  if (!quizLink) notFound();

  const session = await auth();
  let attempt = null;

  if (session?.user?.id) {
    attempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quizLink.quizId,
        },
      },
    });
  } else if (quizLink.userId) {
    attempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: quizLink.userId,
          quizId: quizLink.quizId,
        },
      },
    });
  }

  const pct =
    attempt?.isComplete && attempt.totalPoints
      ? Math.round(((attempt.score || 0) / attempt.totalPoints) * 100)
      : null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-900/30 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Quiz Submitted
          </h1>
          <p className="text-zinc-400">
            You have already submitted{" "}
            <span className="text-white font-medium">
              {quizLink.quiz.title}
            </span>
            . Your responses have been recorded.
          </p>
          {pct !== null && (
            <p className="text-lg font-semibold mt-3">
              <span
                className={
                  pct >= 70 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400"
                }
              >
                Score: {attempt!.score}/{attempt!.totalPoints} ({pct}%)
              </span>
            </p>
          )}
        </div>
        {attempt?.id && (
          <Link
            href={`/quiz/${token}/results/${attempt.id}`}
            className="inline-block bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black font-semibold px-6 py-3 rounded-lg text-sm"
          >
            View Detailed Results
          </Link>
        )}
        <p className="text-zinc-500 text-sm">
          Each quiz can only be taken once. Contact your administrator if you
          believe this is an error.
        </p>
      </div>
    </div>
  );
}
