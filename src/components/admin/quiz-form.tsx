"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  durationMin: z.number().min(1).max(180),
  type: z.enum(["PUBLIC", "PRIVATE"]),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface QuizFormProps {
  defaultValues?: Partial<FormData>;
  quizId?: string;
}

export function QuizForm({ defaultValues, quizId }: QuizFormProps) {
  const router = useRouter();
  const isEdit = !!quizId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "MEDIUM",
      durationMin: 20,
      type: "PRIVATE",
      isActive: true,
      ...defaultValues,
    },
  });

  const difficulty = watch("difficulty");
  const type = watch("type");
  const isActive = watch("isActive");

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const res = await fetch(
      isEdit ? `/api/admin/quizzes/${quizId}` : "/api/admin/quizzes",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
      return;
    }

    const quiz = await res.json();
    toast.success(isEdit ? "Quiz updated" : "Quiz created");

    if (!isEdit) {
      router.push(`/admin/quizzes/${quiz.id}/questions`);
    } else {
      router.push("/admin/quizzes");
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-2">
        <Label className="text-slate-300">Title</Label>
        <Input
          {...register("title")}
          placeholder="JavaScript Fundamentals"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
        {errors.title && (
          <p className="text-red-400 text-xs">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Description (optional)</Label>
        <Textarea
          {...register("description")}
          placeholder="Brief description of this quiz..."
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Difficulty</Label>
          <Select
            value={difficulty}
            onValueChange={(val) =>
              setValue("difficulty", val as "EASY" | "MEDIUM" | "HARD")
            }
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="EASY" className="text-white">Easy</SelectItem>
              <SelectItem value="MEDIUM" className="text-white">Medium</SelectItem>
              <SelectItem value="HARD" className="text-white">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Duration (minutes)</Label>
          <Input
            {...register("durationMin", { valueAsNumber: true })}
            type="number"
            min={1}
            max={180}
            className="bg-slate-800 border-slate-700 text-white"
          />
          {errors.durationMin && (
            <p className="text-red-400 text-xs">{errors.durationMin.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Type</Label>
        <Select
          value={type}
          onValueChange={(val) => setValue("type", val as "PUBLIC" | "PRIVATE")}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="PRIVATE" className="text-white">
              Private (unique links per user)
            </SelectItem>
            <SelectItem value="PUBLIC" className="text-white">
              Public (open link)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setValue("isActive", e.target.checked)}
          className="w-4 h-4 accent-sky-600"
        />
        <Label htmlFor="isActive" className="text-slate-300 cursor-pointer">
          Active (visible to participants)
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-sky-600 hover:bg-sky-700 text-white"
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
            ? "Save Changes"
            : "Create Quiz & Add Questions"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/quizzes")}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
