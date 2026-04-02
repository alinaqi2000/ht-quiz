import { z } from "zod";

export const startAttemptSchema = z.object({
  token: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  groupLeaderId: z.string().optional(),
});

export const autosaveSchema = z.object({
  attemptId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type AutosaveInput = z.infer<typeof autosaveSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
