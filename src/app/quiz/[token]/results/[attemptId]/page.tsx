export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

const difficultyColors: Record<string, string> = {
  EASY: "border-green-600/50 text-green-400 bg-green-900/20",
  MEDIUM: "border-yellow-600/50 text-yellow-400 bg-yellow-900/20",
  HARD: "border-red-600/50 text-red-400 bg-red-900/20",
};

const optionKeys = ["A", "B", "C", "D"] as const;
const optionFields = ["optionA", "optionB", "optionC", "optionD"] as const;

export default async function UserResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; attemptId: string }>;
  searchParams: Promise<{ uid?: string }>;
}) {
  const { token, attemptId } = await params;
  const { uid } = await searchParams;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      quiz: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!attempt || !attempt.isComplete) notFound();

  // Verify the token belongs to this quiz
  const quizLink = await prisma.quizLink.findUnique({
    where: { token },
    select: { quizId: true },
  });
  if (!quizLink || quizLink.quizId !== attempt.quizId) notFound();

  // Check access: must be the attempt owner
  const session = await auth();
  const isOwnerSession = session?.user?.id === attempt.userId;
  // uid query param is set for internal/private links where no session exists
  const isOwnerParam = uid && uid === attempt.userId;
  // Private link: quizLink.userId matches attempt owner
  const fullLink = await prisma.quizLink.findUnique({
    where: { token },
    select: { userId: true, linkType: true },
  });
  const isOwnerPrivateLink = fullLink?.userId === attempt.userId;

  if (!isOwnerSession && !isOwnerParam && !isOwnerPrivateLink) {
    redirect(`/quiz/${token}`);
  }

  const answers: Record<string, string> = (() => {
    try {
      return JSON.parse(attempt.answers as string);
    } catch {
      return {};
    }
  })();

  // Reorder questions by stored questionOrder
  let questions = attempt.quiz.questions;
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

  const pct =
    attempt.totalPoints
      ? Math.round(((attempt.score || 0) / attempt.totalPoints) * 100)
      : 0;

  const correctCount = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const wrongCount = questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctAnswer).length;
  const skippedCount = questions.filter((q) => !answers[q.id]).length;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/quiz/${token}`}
            className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1 mb-4"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white">{attempt.quiz.title}</h1>
          <p className="text-zinc-400 text-sm mt-1">Your results</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Score</p>
              <p className="text-white font-bold text-2xl mt-1">
                {attempt.score}/{attempt.totalPoints}
              </p>
              <p
                className={cn(
                  "text-sm font-medium mt-1",
                  pct >= 70 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400"
                )}
              >
                {pct}%
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Correct</p>
              <p className="text-green-400 font-bold text-2xl mt-1">{correctCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Wrong</p>
              <p className="text-red-400 font-bold text-2xl mt-1">{wrongCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Skipped</p>
              <p className="text-zinc-400 font-bold text-2xl mt-1">{skippedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Question breakdown */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              const isSkipped = !userAnswer;

              return (
                <div
                  key={question.id}
                  className={cn(
                    "rounded-xl border p-4 space-y-4",
                    isSkipped
                      ? "border-zinc-700 bg-zinc-900/30"
                      : isCorrect
                      ? "border-green-700/50 bg-green-900/10"
                      : "border-red-700/50 bg-red-900/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-amber-400 text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", difficultyColors[question.difficulty] ?? "")}
                        >
                          {question.difficulty}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            isSkipped
                              ? "border-zinc-600 text-zinc-400"
                              : isCorrect
                              ? "border-green-600/50 text-green-400"
                              : "border-red-600/50 text-red-400"
                          )}
                        >
                          {isSkipped ? "Skipped" : isCorrect ? "Correct" : "Wrong"}
                        </Badge>
                      </div>
                      <p className="text-white text-sm font-medium leading-relaxed">
                        {question.text}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-0 sm:ml-11">
                    {optionKeys.map((key, i) => {
                      const text = question[optionFields[i]];
                      const isUserPick = userAnswer === key;
                      const isCorrectAnswer = question.correctAnswer === key;

                      return (
                        <div
                          key={key}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border text-left",
                            isCorrectAnswer && isUserPick
                              ? "bg-green-500/15 border-green-400"
                              : isCorrectAnswer
                              ? "bg-green-900/20 border-green-700/60"
                              : isUserPick
                              ? "bg-red-500/15 border-red-400"
                              : "bg-zinc-800/40 border-zinc-700"
                          )}
                        >
                          <div
                            className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                              isCorrectAnswer && isUserPick
                                ? "bg-green-500 text-black"
                                : isCorrectAnswer
                                ? "bg-green-700 text-white"
                                : isUserPick
                                ? "bg-red-500 text-white"
                                : "bg-zinc-700 text-zinc-400"
                            )}
                          >
                            {key}
                          </div>
                          <span
                            className={cn(
                              "text-sm flex-1",
                              isCorrectAnswer
                                ? "text-green-300 font-medium"
                                : isUserPick
                                ? "text-red-300 font-medium"
                                : "text-zinc-400"
                            )}
                          >
                            {text}
                          </span>
                          <div className="flex gap-1 shrink-0">
                            {isCorrectAnswer && (
                              <span className="text-xs text-green-400 font-medium">✓ correct</span>
                            )}
                            {isUserPick && !isCorrectAnswer && (
                              <span className="text-xs text-red-400 font-medium">✗ selected</span>
                            )}
                            {isUserPick && isCorrectAnswer && (
                              <span className="text-xs text-green-400 font-medium">✓ selected</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
