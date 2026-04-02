export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { QuizForm } from "@/components/admin/quiz-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id } });

  if (!quiz) notFound();

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader title="Edit Quiz" description={quiz.title} />
      <div className="p-6">
        <QuizForm
          quizId={quiz.id}
          defaultValues={{
            title: quiz.title,
            description: quiz.description ?? "",
            difficulty: quiz.difficulty as "EASY" | "MEDIUM" | "HARD",
            durationMin: quiz.durationMin,
            type: quiz.type as "PUBLIC" | "PRIVATE",
            isActive: quiz.isActive,
          }}
        />
      </div>
    </div>
  );
}
