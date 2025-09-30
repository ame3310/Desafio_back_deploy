import { Schema, model } from "mongoose";

const expenseSchema = new Schema(
  {
    empresaId: { type: String, required: true, index: true },
    usuarioId: { type: String, required: true, index: true },
    tipo: {
      type: String,
      enum: ["combustible", "peaje", "electrico"],
      required: true,
      index: true,
    },
    fecha: { type: Date, required: true, index: true },
    importe: { type: Number, required: true },
    moneda: { type: String, default: "EUR" },
    estacion: String,
    provincia: String,
    matricula: String,
    metodoPago: String,
    origen: String,
  },
  { timestamps: true }
);

expenseSchema.index({ empresaId: 1, usuarioId: 1, fecha: 1, tipo: 1 });
expenseSchema.index({ empresaId: 1, fecha: 1 });

export const Expense = model("Expense", expenseSchema, "Gastos");
