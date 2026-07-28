import { Role } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(120),
  role: z
    .enum([Role.REFERRER, Role.CANDIDATE])
    .optional()
    .default(Role.REFERRER),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
