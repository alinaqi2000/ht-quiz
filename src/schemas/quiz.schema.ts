import { z } from "zod";

export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  durationMin: z.number().int().min(1).max(300).default(20),
  type: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
  isActive: z.boolean().default(true),
});

export const updateQuizSchema = createQuizSchema.partial();

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
