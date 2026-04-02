export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { QuizTable } from "@/components/admin/quiz-table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getQuizzes() {
  return prisma.quiz.findMany({
    include: {
      _count: {
        select: {
          questions: true,
          attempts: { where: { isComplete: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function QuizzesPage() {
  const quizzes = await getQuizzes();

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Quizzes"
        description={`${quizzes.length} total quizzes`}
      >
        <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white">
          <Link href="/admin/quizzes/new">
            <Plus className="w-4 h-4 mr-2" />
            New Quiz
          </Link>
        </Button>
      </AdminHeader>

      <div className="p-6">
        <QuizTable quizzes={JSON.parse(JSON.stringify(quizzes))} />
      </div>
    </div>
  );
}
