import type { Request, Response, NextFunction } from "express";

const PLATE_RE = /^[A-Z0-9\-\.]{4,15}$/i; 
export function validateCreateVehicle(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];
  const { plate, odometerKm, driverId } = req.body ?? {};

  if (typeof plate !== "string" || !plate.trim()) errors.push("plate es obligatorio");
  else if (!PLATE_RE.test(String(plate))) errors.push("plate tiene un formato inválido");

  if (odometerKm != null && (typeof odometerKm !== "number" || odometerKm < 0))
    errors.push("odometerKm debe ser un número >= 0");

  if (driverId != null && typeof driverId !== "string") errors.push("driverId debe ser string (ObjectId)");

  if (errors.length) return res.status(400).json({ error: "VALIDATION", details: errors });
  next();
}
