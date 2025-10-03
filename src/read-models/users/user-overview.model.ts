import { Schema, model, Types } from "mongoose";

export interface UserOverviewRM {
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  yearMonth: string; 
  totals: { fuel: number; tolls: number; electric: number; grandTotal: number };
  counts: { tickets: number };
  updatedAt: Date;
}

const schema = new Schema<UserOverviewRM>(
  {
    companyId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    yearMonth: { type: String, required: true, index: true },
    totals: {
      fuel: { type: Number, default: 0 },
      tolls: { type: Number, default: 0 },
      electric: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    counts: { tickets: { type: Number, default: 0 } },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "rm_user_overview" }
);
schema.index({ companyId: 1, userId: 1, yearMonth: 1 }, { unique: true });

export const UserOverview = model<UserOverviewRM>("UserOverviewRM", schema);
