export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

async function getAllResults() {
  return prisma.quizAttempt.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      quiz: { select: { id: true, title: true, durationMin: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}

export default async function ResultsPage() {
  const attempts = await getAllResults();
  const completed = attempts.filter((a) => a.isComplete);

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="All Results"
        description={`${completed.length} completed / ${attempts.length} total attempts`}
      />

      <div className="p-6">
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Quiz</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Score</TableHead>
                <TableHead className="text-slate-400">%</TableHead>
                <TableHead className="text-slate-400">Started</TableHead>
                <TableHead className="text-slate-400">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-slate-500 py-12"
                  >
                    No attempts yet
                  </TableCell>
                </TableRow>
              ) : (
                attempts.map((attempt) => {
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
                      <TableCell className="text-slate-300 text-sm">
                        {attempt.quiz.title}
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
                          {attempt.isComplete ? "Done" : "In Progress"}
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
                                ? "text-green-400 font-medium"
                                : pct >= 50
                                ? "text-yellow-400 font-medium"
                                : "text-red-400 font-medium"
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
                          ? format(new Date(attempt.submittedAt), "MMM d, HH:mm")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
