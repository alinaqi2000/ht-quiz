export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [quiz, attempts] = await Promise.all([
    prisma.quiz.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    }),
    prisma.quizAttempt.findMany({
      where: { quizId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  if (!quiz) notFound();

  const completed = attempts.filter((a) => a.isComplete);
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce(
            (acc, a) =>
              acc + (a.totalPoints ? ((a.score || 0) / a.totalPoints) * 100 : 0),
            0
          ) / completed.length
        )
      : null;

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title={`Results — ${quiz.title}`}
        description={`${completed.length} completed attempts`}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm">Total Attempts</p>
              <p className="text-2xl font-bold text-white mt-1">
                {attempts.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white mt-1">
                {completed.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-white mt-1">
                {avgScore !== null ? `${avgScore}%` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">
              All Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">
                No attempts yet
              </p>
            ) : (
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Score</TableHead>
                      <TableHead className="text-slate-400">Percentage</TableHead>
                      <TableHead className="text-slate-400">Started</TableHead>
                      <TableHead className="text-slate-400">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => {
                      const pct =
                        attempt.isComplete && attempt.totalPoints
                          ? Math.round(
                              ((attempt.score || 0) / attempt.totalPoints) * 100
                            )
                          : null;

                      return (
                        <TableRow
                          key={attempt.id}
                          className="border-slate-700 hover:bg-slate-800/50"
                        >
                          <TableCell>
                            <p className="text-white text-sm font-medium">
                              {attempt.user.name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {attempt.user.email}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                attempt.isComplete
                                  ? "border-green-600/50 text-green-400"
                                  : "border-yellow-600/50 text-yellow-400"
                              }
                            >
                              {attempt.isComplete ? "Completed" : "In Progress"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {attempt.isComplete
                              ? `${attempt.score}/${attempt.totalPoints}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {pct !== null ? (
                              <span
                                className={
                                  pct >= 70
                                    ? "text-green-400"
                                    : pct >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }
                              >
                                {pct}%
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {format(new Date(attempt.startedAt), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {attempt.submittedAt
                              ? format(
                                  new Date(attempt.submittedAt),
                                  "MMM d, HH:mm"
                                )
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
