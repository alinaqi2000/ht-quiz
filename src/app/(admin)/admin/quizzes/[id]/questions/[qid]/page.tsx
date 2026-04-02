import { AdminHeader } from "@/components/admin/header";
import { QuestionForm } from "@/components/admin/question-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string; qid: string }>;
}) {
  const { id, qid } = await params;
  const [quiz, question] = await Promise.all([
    prisma.quiz.findUnique({ where: { id } }),
    prisma.question.findUnique({ where: { id: qid } }),
  ]);

  if (!quiz || !question) notFound();

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Edit Question"
        description={`Editing in: ${quiz.title}`}
      />
      <div className="p-6">
        <QuestionForm
          quizId={id}
          questionId={qid}
          defaultValues={{
            text: question.text,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer as "A" | "B" | "C" | "D",
            difficulty: question.difficulty as "EASY" | "MEDIUM" | "HARD",
          }}
        />
      </div>
    </div>
  );
}
