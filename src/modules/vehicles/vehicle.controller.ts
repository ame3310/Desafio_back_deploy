import type { Request, Response } from "express";
import { createVehicleForCompany } from "./vehicle.service";
import type { CreateVehicleInput } from "./vehicle.schemas";

export async function createVehicle(req: Request, res: Response) {
  const companyId = String(req.user!.companyId); 
  const input = req.body as CreateVehicleInput;

  const v = await createVehicleForCompany(companyId, input);

  res.status(201).json({
    vehicle: {
      id: v._id,
      plate: v.plate,
      vehicleModel: v.vehicleModel,
      odometerKm: v.odometerKm,
      driverId: v.driverId ?? null,
      active: v.active,
      createdAt: v.createdAt,
    },
  });
}
