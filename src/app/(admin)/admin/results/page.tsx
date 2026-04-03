export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { SearchInput } from "@/components/admin/search-input";
import { TablePagination } from "@/components/admin/table-pagination";
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
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search = "", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = search
    ? {
        OR: [
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
          { quiz: { title: { contains: search } } },
        ],
      }
    : {};

  const [attempts, total, completedTotal] = await Promise.all([
    prisma.quizAttempt.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        quiz: { select: { id: true, title: true, durationMin: true } },
      },
      orderBy: { startedAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.quizAttempt.count({ where }),
    prisma.quizAttempt.count({ where: { isComplete: true } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="All Results"
        description={`${completedTotal} completed / ${total} total${search ? " (filtered)" : ""}`}
      />

      <div className="p-6 space-y-4">
        <SearchInput placeholder="Search by user, email or quiz…" />

        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">User</TableHead>
                <TableHead className="text-zinc-400">Quiz</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Score</TableHead>
                <TableHead className="text-zinc-400">%</TableHead>
                <TableHead className="text-zinc-400">Started</TableHead>
                <TableHead className="text-zinc-400">Submitted</TableHead>
                <TableHead className="text-zinc-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-zinc-500 py-12"
                  >
                    {search ? `No results matching "${search}"` : "No attempts yet"}
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
                      <TableCell className="text-zinc-300 text-sm">
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
                                ? "text-green-400 font-medium"
                                : pct >= 50
                                ? "text-yellow-400 font-medium"
                                : "text-red-400 font-medium"
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
                          ? format(new Date(attempt.submittedAt), "MMM d, HH:mm")
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
                })
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
