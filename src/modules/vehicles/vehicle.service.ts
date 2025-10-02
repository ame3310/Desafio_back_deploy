import { Vehicle } from "./vehicle.model";
import type { CreateVehicleInput } from "./vehicle.schemas";
import { ApiError } from "@shared/errors/apiError";

export async function createVehicleForCompany(
  companyId: string,
  input: CreateVehicleInput
) {
  const exists = await Vehicle.findOne({
    plate: input.plate.toUpperCase(),
  }).lean();
  if (exists) {
    throw ApiError.badRequest("La matrícula ya existe");
  }
  const doc = await Vehicle.create({
    companyId,
    driverId: input.driverId ?? null,
    plate: input.plate.toUpperCase(),
    vehicleModel: input.vehicleModel,
    odometerKm: input.odometerKm ?? 0,
  });
  return doc.toObject();
}

export async function countVehicles(companyId: string) {
  return Vehicle.countDocuments({ companyId });
}
