import { z } from "zod";

export const CreateVehicleSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(4, "plate demasiado corto")
    .max(15, "plate demasiado largo")
    .regex(/^[A-Z0-9\-\.]+$/i, "plate con caracteres inválidos"),
  vehicleModel: z
    .string()
    .trim()
    .min(1, "vehicleModel requerido")
    .max(50, "vehicleModel máximo 50 caracteres"),
  odometerKm: z.number().nonnegative().optional().default(0),
  driverId: z.string().optional().nullable(),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
