import { z } from "zod";

const CIF_REGEX = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/i;

export const createCompanySchema = z.object({
  name: z.string().min(2).max(120),
  cif: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine((v) => CIF_REGEX.test(v), { message: "CIF no válido" }),
  contactEmail: z.string().email(),
  plan: z.enum(["starter", "pro", "enterprise"]).optional(),
});

export type CreateCompanyDTO = z.infer<typeof createCompanySchema>;
