import { z } from "zod";

export const predictSchema = z.object({
  body: z.object({
    age: z.number().int().min(1).max(120),
    gender: z.number().int().min(0).max(1),
    marital_status: z.number().int().min(0).max(3),
    employment_status: z.number().int().min(0).max(3),
    region: z.number().int().min(0).max(10),
    prev_chronic_conditions: z.number().int().min(0).max(1),
    allergic_reaction: z.number().int().min(0).max(1),
    receiving_immu0therapy: z.number().int().min(0).max(1),
  }),
});

export type PredictInput = z.infer<typeof predictSchema>["body"];