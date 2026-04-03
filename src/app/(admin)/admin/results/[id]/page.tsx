export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

const difficultyColors: Record<string, string> = {
  EASY: "border-green-600/50 text-green-400 bg-green-900/20",
  MEDIUM: "border-yellow-600/50 text-yellow-400 bg-yellow-900/20",
  HARD: "border-red-600/50 text-red-400 bg-red-900/20",
};

const optionKeys = ["A", "B", "C", "D"] as const;
const optionFields = ["optionA", "optionB", "optionC", "optionD"] as const;

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      quiz: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!attempt) notFound();

  const answers: Record<string, string> = (() => {
    try {
      return JSON.parse(attempt.answers as string);
    } catch {
      return {};
    }
  })();

  const pct =
    attempt.isComplete && attempt.totalPoints
      ? Math.round(((attempt.score || 0) / attempt.totalPoints) * 100)
      : null;

  const questions = attempt.quiz.questions;
  const correctCount = questions.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;
  const wrongCount = questions.filter(
    (q) => answers[q.id] && answers[q.id] !== q.correctAnswer
  ).length;
  const skippedCount = questions.filter((q) => !answers[q.id]).length;

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Attempt Detail"
        description={`${attempt.user.name} — ${attempt.quiz.title}`}
      />

      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link
          href="/admin/results"
          className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
        >
          ← Back to Results
        </Link>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">User</p>
              <p className="text-white font-semibold mt-1 text-sm">{attempt.user.name}</p>
              <p className="text-zinc-500 text-xs">{attempt.user.email}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Score</p>
              <p className="text-white font-bold text-2xl mt-1">
                {attempt.isComplete ? `${attempt.score}/${attempt.totalPoints}` : "—"}
              </p>
              {pct !== null && (
                <p
                  className={cn(
                    "text-sm font-medium",
                    pct >= 70
                      ? "text-green-400"
                      : pct >= 50
                      ? "text-yellow-400"
                      : "text-red-400"
                  )}
                >
                  {pct}%
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Breakdown</p>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-green-400">{correctCount} correct</p>
                <p className="text-red-400">{wrongCount} wrong</p>
                <p className="text-zinc-500">{skippedCount} skipped</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-5">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Timing</p>
              <div className="mt-2 space-y-1 text-xs text-zinc-400">
                <p>Started: {format(new Date(attempt.startedAt), "MMM d, HH:mm")}</p>
                <p>
                  Submitted:{" "}
                  {attempt.submittedAt
                    ? format(new Date(attempt.submittedAt), "MMM d, HH:mm")
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions breakdown */}
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
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-amber-400 text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            difficultyColors[question.difficulty] ?? ""
                          )}
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

                  {/* Options */}
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
                              <span className="text-xs text-green-400 font-medium">
                                ✓ correct
                              </span>
                            )}
                            {isUserPick && !isCorrectAnswer && (
                              <span className="text-xs text-red-400 font-medium">
                                ✗ selected
                              </span>
                            )}
                            {isUserPick && isCorrectAnswer && (
                              <span className="text-xs text-green-400 font-medium">
                                ✓ selected
                              </span>
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
