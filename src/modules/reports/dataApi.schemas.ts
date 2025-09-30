import { z } from "zod";

export const ParamsEmpresaYM = z.object({
  idEmpresa: z.string().min(1),
  year: z.number().int().gte(2000).lte(2100),
  month: z.number().int().gte(1).lte(12),
});
export type ParamsEmpresaYM = z.infer<typeof ParamsEmpresaYM>;

export const ParamsUsuarioY = z.object({
  idUsuario: z.string().min(1),
  year: z.number().int().gte(2000).lte(2100),
});
export type ParamsUsuarioY = z.infer<typeof ParamsUsuarioY>;

export const PiePorTipoRow = z.object({
  tipo: z.enum(["combustible", "peaje", "electrico"]),
  total: z.number(),
});
export type PiePorTipoRow = z.infer<typeof PiePorTipoRow>;

export const TotalPorUsuarioRow = z.object({
  idUsuario: z.string(),
  total: z.number(),
});
export type TotalPorUsuarioRow = z.infer<typeof TotalPorUsuarioRow>;

export const SerieMensualRow = z.object({
  month: z.number().int().gte(1).lte(12),
  total: z.number(),
});
export type SerieMensualRow = z.infer<typeof SerieMensualRow>;
