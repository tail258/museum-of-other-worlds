import { z } from "zod";

export const worldviewSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().trim().min(2).max(40),
  prompt: z.string().trim().min(20).max(1200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Worldview = z.infer<typeof worldviewSchema>;

export type SaveWorldviewInput = Pick<Worldview, "id" | "name" | "prompt">;
