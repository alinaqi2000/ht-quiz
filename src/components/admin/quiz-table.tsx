"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, HelpCircle, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  durationMin: number;
  type: string;
  isActive: boolean;
  createdAt: string;
  _count: { questions: number; attempts: number };
}

const difficultyColors = {
  EASY: "border-green-600/50 text-green-400",
  MEDIUM: "border-yellow-600/50 text-yellow-400",
  HARD: "border-red-600/50 text-red-400",
};

export function QuizTable({ quizzes }: { quizzes: Quiz[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!res.ok) {
      toast.error("Failed to delete quiz");
      return;
    }

    toast.success("Quiz deleted");
    router.refresh();
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No quizzes yet. Create your first quiz.
      </div>
    );
  }

  function ActionButtons({ quiz }: { quiz: Quiz }) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-400 hover:text-white hover:bg-slate-700"
          title="Questions"
        >
          <Link href={`/admin/quizzes/${quiz.id}/questions`}>
            <HelpCircle className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-400 hover:text-white hover:bg-slate-700"
          title="Assign"
        >
          <Link href={`/admin/quizzes/${quiz.id}/assign`}>
            <Users className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-400 hover:text-white hover:bg-slate-700"
          title="Results"
        >
          <Link href={`/admin/quizzes/${quiz.id}/results`}>
            <BarChart3 className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-400 hover:text-white hover:bg-slate-700"
          title="Edit"
        >
          <Link href={`/admin/quizzes/${quiz.id}`}>
            <Edit className="w-4 h-4" />
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              disabled={deletingId === quiz.id}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-800 border-slate-700 mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Delete Quiz
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Delete &quot;{quiz.title}&quot;? All questions and attempts will
                be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(quiz.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{quiz.title}</p>
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <Badge
                    variant="outline"
                    className={
                      quiz.type === "PUBLIC"
                        ? "border-green-600/50 text-green-400 text-xs"
                        : "border-orange-600/50 text-orange-400 text-xs"
                    }
                  >
                    {quiz.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      difficultyColors[
                        quiz.difficulty as keyof typeof difficultyColors
                      ] + " text-xs"
                    }
                  >
                    {quiz.difficulty}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      quiz.isActive
                        ? "border-green-600/50 text-green-400 text-xs"
                        : "border-slate-600 text-slate-500 text-xs"
                    }
                  >
                    {quiz.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <ActionButtons quiz={quiz} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{quiz._count.questions} questions</span>
              <span>{quiz.durationMin}min</span>
              <span>{quiz._count.attempts} attempts</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block rounded-lg border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Title</TableHead>
              <TableHead className="text-slate-400">Type</TableHead>
              <TableHead className="text-slate-400">Difficulty</TableHead>
              <TableHead className="text-slate-400">Duration</TableHead>
              <TableHead className="text-slate-400">Questions</TableHead>
              <TableHead className="text-slate-400">Attempts</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow
                key={quiz.id}
                className="border-slate-700 hover:bg-slate-800/50"
              >
                <TableCell className="text-white font-medium">
                  {quiz.title}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      quiz.type === "PUBLIC"
                        ? "border-green-600/50 text-green-400"
                        : "border-orange-600/50 text-orange-400"
                    }
                  >
                    {quiz.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      difficultyColors[
                        quiz.difficulty as keyof typeof difficultyColors
                      ]
                    }
                  >
                    {quiz.difficulty}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300">
                  {quiz.durationMin}m
                </TableCell>
                <TableCell className="text-slate-300">
                  {quiz._count.questions}
                </TableCell>
                <TableCell className="text-slate-300">
                  {quiz._count.attempts}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      quiz.isActive
                        ? "border-green-600/50 text-green-400"
                        : "border-slate-600 text-slate-500"
                    }
                  >
                    {quiz.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ActionButtons quiz={quiz} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
