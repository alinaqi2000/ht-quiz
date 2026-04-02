import { z } from "zod";

export const assignQuizSchema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one user"),
  expiresAt: z.string().optional(),
});

export type AssignQuizInput = z.infer<typeof assignQuizSchema>;
