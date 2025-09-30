import "dotenv/config";                  // carga .env (en la raíz del proyecto)
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI es obligatorio"),

  ACCESS_TOKEN_SECRET: z.string().min(1),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  DATA_API_BASE: z.string().optional().default(""),
  DATA_API_KEY: z.string().optional().default(""),

  OCR_API_BASE: z.string().min(1, "OCR_API_BASE es obligatorio"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  REDIS_URL: z.string().optional().default("redis://127.0.0.1:6379"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Error en variables de entorno:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
