import { Schema, model } from "mongoose";
import { CompanyProps } from "@modules/company/company.types";

const schema = new Schema<CompanyProps>(
  {
    name: { type: String, required: true, trim: true, index: true },
    cif: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },
    contactEmail: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    externalId: { type: String, default: null, index: true }, // por lo del "EMP001" (borrar tras llegar a acuerdo)
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
      index: true,
    },
    plan: {
      type: String,
      enum: ["starter", "pro", "enterprise"],
      default: "starter",
    },
    managerIds: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

schema.index({ name: 1 }, { name: "ix_company_name" });
schema.index(
  { externalId: 1 },
  { name: "ix_company_externalId", sparse: true, unique: false }
);

export const Company = model<CompanyProps>("Company", schema);
