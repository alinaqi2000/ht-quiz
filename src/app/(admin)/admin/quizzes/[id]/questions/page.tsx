export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { QuestionDeleteButton } from "./question-delete-button";

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!quiz) notFound();

  const difficultyColors = {
    EASY: "border-green-600/50 text-green-400",
    MEDIUM: "border-yellow-600/50 text-yellow-400",
    HARD: "border-red-600/50 text-red-400",
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title={`Questions — ${quiz.title}`}
        description={`${quiz.questions.length} questions`}
      >
        <Button asChild className="bg-sky-600 hover:bg-sky-700 text-white">
          <Link href={`/admin/quizzes/${id}/questions/new`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Link>
        </Button>
      </AdminHeader>

      <div className="p-6 space-y-3">
        <div className="flex gap-3 mb-4">
          <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Link href={`/admin/quizzes/${id}/assign`}>Assign Quiz</Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Link href={`/admin/quizzes/${id}/results`}>View Results</Link>
          </Button>
        </div>

        {quiz.questions.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center text-slate-500">
              No questions yet. Add your first question.
            </CardContent>
          </Card>
        ) : (
          quiz.questions.map((q, index) => (
            <Card key={q.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-slate-300 text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium mb-3">{q.text}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "A", value: q.optionA },
                        { label: "B", value: q.optionB },
                        { label: "C", value: q.optionC },
                        { label: "D", value: q.optionD },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                            q.correctAnswer === label
                              ? "bg-green-900/30 border border-green-600/40"
                              : "bg-slate-700/50"
                          }`}
                        >
                          <span
                            className={`font-semibold text-xs w-4 ${
                              q.correctAnswer === label
                                ? "text-green-400"
                                : "text-slate-500"
                            }`}
                          >
                            {label}
                          </span>
                          <span
                            className={
                              q.correctAnswer === label
                                ? "text-green-300"
                                : "text-slate-300"
                            }
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        difficultyColors[
                          q.difficulty as keyof typeof difficultyColors
                        ]
                      }
                    >
                      {q.difficulty}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <Link
                        href={`/admin/quizzes/${id}/questions/${q.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <QuestionDeleteButton quizId={id} questionId={q.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
