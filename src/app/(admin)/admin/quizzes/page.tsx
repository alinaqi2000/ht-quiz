export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { QuizTable } from "@/components/admin/quiz-table";
import { SearchInput } from "@/components/admin/search-input";
import { TablePagination } from "@/components/admin/table-pagination";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search = "", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = search ? { title: { contains: search } } : {};

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
            attempts: { where: { isComplete: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.quiz.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Quizzes"
        description={`${total} total quizzes`}
      >
        <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black">
          <Link href="/admin/quizzes/new">
            <Plus className="w-4 h-4 mr-2" />
            New Quiz
          </Link>
        </Button>
      </AdminHeader>

      <div className="p-6 space-y-4">
        <SearchInput placeholder="Search by title…" />
        <QuizTable quizzes={JSON.parse(JSON.stringify(quizzes))} />
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
