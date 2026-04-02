import { AdminHeader } from "@/components/admin/header";
import { QuestionForm } from "@/components/admin/question-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id } });

  if (!quiz) notFound();

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Add Question"
        description={`Adding to: ${quiz.title}`}
      />
      <div className="p-6">
        <QuestionForm quizId={id} />
      </div>
    </div>
  );
}
