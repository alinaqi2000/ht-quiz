export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { SearchInput } from "@/components/admin/search-input";
import { TablePagination } from "@/components/admin/table-pagination";
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
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function QuizResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { id } = await params;
  const { search = "", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const searchWhere = search
    ? {
        OR: [
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }
    : {};

  const [quiz, totalCount, completedCount, scoreAgg, attempts, filteredCount] =
    await Promise.all([
      prisma.quiz.findUnique({
        where: { id },
        include: { _count: { select: { questions: true } } },
      }),
      prisma.quizAttempt.count({ where: { quizId: id } }),
      prisma.quizAttempt.count({ where: { quizId: id, isComplete: true } }),
      prisma.quizAttempt.aggregate({
        where: { quizId: id, isComplete: true },
        _avg: { score: true },
      }),
      prisma.quizAttempt.findMany({
        where: { quizId: id, ...searchWhere },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { startedAt: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.quizAttempt.count({ where: { quizId: id, ...searchWhere } }),
    ]);

  if (!quiz) notFound();

  const totalPages = Math.ceil(filteredCount / PAGE_SIZE);

  const avgScore =
    completedCount > 0 && scoreAgg._avg.score !== null && quiz._count.questions > 0
      ? Math.round((scoreAgg._avg.score / quiz._count.questions) * 100)
      : null;

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title={`Results — ${quiz.title}`}
        description={`${completedCount} completed attempts`}
      />

      <div className="p-6 space-y-6">
        {/* Stats — always show totals for the whole quiz, not filtered */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Total Attempts</p>
              <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white mt-1">{completedCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-zinc-400 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-white mt-1">
                {avgScore !== null ? `${avgScore}%` : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-white text-base">All Attempts</CardTitle>
            <SearchInput placeholder="Search by user or email…" />
          </CardHeader>
          <CardContent className="pt-0">
            {attempts.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">
                {search ? `No results matching "${search}"` : "No attempts yet"}
              </p>
            ) : (
              <>
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">User</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Score</TableHead>
                        <TableHead className="text-zinc-400">Percentage</TableHead>
                        <TableHead className="text-zinc-400">Started</TableHead>
                        <TableHead className="text-zinc-400">Submitted</TableHead>
                        <TableHead className="text-zinc-400"></TableHead>
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
                            className="border-zinc-800 hover:bg-zinc-900/50"
                          >
                            <TableCell>
                              <p className="text-white text-sm font-medium">
                                {attempt.user.name}
                              </p>
                              <p className="text-zinc-400 text-xs">
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
                            <TableCell className="text-zinc-300">
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
                                <span className="text-zinc-500">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-zinc-400 text-sm">
                              {format(new Date(attempt.startedAt), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell className="text-zinc-400 text-sm">
                              {attempt.submittedAt
                                ? format(
                                    new Date(attempt.submittedAt),
                                    "MMM d, HH:mm"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/admin/results/${attempt.id}`}
                                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                View →
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-2">
                  <TablePagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={filteredCount}
                    pageSize={PAGE_SIZE}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
