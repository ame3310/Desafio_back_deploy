import { Schema, model, Types } from "mongoose";

export interface ManagerOverviewRM {
  companyId: Types.ObjectId;
  yearMonth: string;
  totals: { fuel: number; tolls: number; electric: number; grandTotal: number };
  breakdownByType: Array<{ type: "fuel" | "toll" | "electric"; total: number }>;
  rankingUsers: Array<{ userId: Types.ObjectId; total: number }>;
  updatedAt: Date;
}

const schema = new Schema<ManagerOverviewRM>(
  {
    companyId: { type: Schema.Types.ObjectId, required: true, index: true },
    yearMonth: { type: String, required: true, index: true },
    totals: {
      fuel: { type: Number, default: 0 },
      tolls: { type: Number, default: 0 },
      electric: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    breakdownByType: [{ type: { type: String }, total: Number }],
    rankingUsers: [{ userId: { type: Schema.Types.ObjectId }, total: Number }],
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "rm_manager_overview" }
);
schema.index({ companyId: 1, yearMonth: 1 }, { unique: true });

export const ManagerOverview = model<ManagerOverviewRM>(
  "ManagerOverviewRM",
  schema
);
