import { Schema, model, Types } from "mongoose";

export interface VehicleDoc {
  companyId: Types.ObjectId;
  driverId?: Types.ObjectId | null;
  plate: string;
  vehicleModel: string;
  odometerKm: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<VehicleDoc>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    plate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    vehicleModel: { type: String, required: true, trim: true, maxlength: 50 },
    odometerKm: { type: Number, default: 0, min: 0 },

    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, collection: "vehicles" }
);

export const Vehicle = model<VehicleDoc>("Vehicle", VehicleSchema);
