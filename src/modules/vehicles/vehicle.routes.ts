import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";
import { createVehicle } from "./vehicle.controller";
import { CreateVehicleSchema } from "./vehicle.schemas";
import type { Request, Response, NextFunction } from "express";

function zodValidate(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const flat = result.error.flatten();
      return res.status(400).json({ error: "VALIDATION", details: flat });
    }
    req.body = result.data;
    next();
  };
}

const r = Router();

// crear vehículo (manager o admin)
r.post(
  "/",
  requireAuth,
  requireRole("manager"),
  zodValidate(CreateVehicleSchema),
  createVehicle
);

export default r;
