"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const schema = z.object({
  text: z.string().min(1, "Question text is required"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

type FormData = z.infer<typeof schema>;

interface QuestionFormProps {
  quizId: string;
  questionId?: string;
  defaultValues?: Partial<FormData>;
}

export function QuestionForm({
  quizId,
  questionId,
  defaultValues,
}: QuestionFormProps) {
  const router = useRouter();
  const isEdit = !!questionId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      difficulty: "MEDIUM",
      ...defaultValues,
    },
  });

  const difficulty = watch("difficulty");
  const correctAnswer = watch("correctAnswer");

  async function onSubmit(data: FormData) {
    const url = isEdit
      ? `/api/admin/quizzes/${quizId}/questions/${questionId}`
      : `/api/admin/quizzes/${quizId}/questions`;

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
      return;
    }

    toast.success(isEdit ? "Question updated" : "Question added");
    router.push(`/admin/quizzes/${quizId}/questions`);
    router.refresh();
  }

  const options = [
    { key: "A" as const, label: "A", field: "optionA" as const },
    { key: "B" as const, label: "B", field: "optionB" as const },
    { key: "C" as const, label: "C", field: "optionC" as const },
    { key: "D" as const, label: "D", field: "optionD" as const },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label className="text-zinc-300">Question Text</Label>
        <Textarea
          {...register("text")}
          placeholder="Enter the question..."
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 resize-none"
          rows={3}
        />
        {errors.text && (
          <p className="text-red-400 text-xs">{errors.text.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-zinc-300">
          Options (select the correct answer)
        </Label>
        <RadioGroup
          value={correctAnswer}
          onValueChange={(val) =>
            setValue("correctAnswer", val as "A" | "B" | "C" | "D")
          }
          className="space-y-2"
        >
          {options.map(({ key, label, field }) => (
            <div key={key} className="flex items-center gap-3">
              <RadioGroupItem
                value={key}
                id={`option-${key}`}
                className="border-zinc-700 text-amber-400"
              />
              <div className="flex items-center gap-2 flex-1">
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                    correctAnswer === key
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {label}
                </span>
                <Input
                  {...register(field)}
                  placeholder={`Option ${label}`}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
          ))}
        </RadioGroup>
        {errors.correctAnswer && (
          <p className="text-red-400 text-xs">{errors.correctAnswer.message}</p>
        )}
        {(errors.optionA || errors.optionB || errors.optionC || errors.optionD) && (
          <p className="text-red-400 text-xs">All options are required</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Difficulty</Label>
        <Select
          value={difficulty}
          onValueChange={(val) =>
            setValue("difficulty", val as "EASY" | "MEDIUM" | "HARD")
          }
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="EASY" className="text-white">Easy</SelectItem>
            <SelectItem value="MEDIUM" className="text-white">Medium</SelectItem>
            <SelectItem value="HARD" className="text-white">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black"
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
            ? "Save Changes"
            : "Add Question"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/quizzes/${quizId}/questions`)}
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
