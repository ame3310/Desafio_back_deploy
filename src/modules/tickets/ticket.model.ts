import { Schema, model, Types } from "mongoose";
import type { TicketProps } from "@modules/tickets/ticket.types";
import { Double } from "bson";

// helpers: casteo seguro a Double y lectura como number
const toDouble = (v: unknown) =>
  v === null || v === undefined ? undefined : new Double(Number(v));
const fromDouble = (v: any) =>
  v === null || v === undefined ? v : Number(v.valueOf?.() ?? v);

// ── subesquemas (sin cambios) ────────────────────────────────────────────────
const LineItemSchema = new Schema(
  {
    producto: { type: String },
    // FUEL
    litros: { type: Number, min: 0 },
    precioPorLitro: { type: Number, min: 0 },
    // EV
    kwh: { type: Number, min: 0 },
    precio_kwh: { type: Number, min: 0 },
    // común
    importe: { type: Number, min: 0 },
  },
  { _id: false }
);

const EstacionSchema = new Schema(
  {
    nombre: { type: String },
    provincia: { type: String },
    tarifa: { type: String },
    potenciaMaxKW: { type: Number, min: 0 },
  },
  { _id: false }
);

// ── esquema principal ───────────────────────────────────────────────────────
const ticketSchema = new Schema<TicketProps>(
  {
    domain: { type: String, enum: ["combustible", "ev", "peaje"], required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", default: null, index: true },

    empresaNombre: { type: String, default: null, index: true },
    fecha: { type: Date, required: true, index: true },

    idPropioTicket: { type: String, default: null },
    source: { type: String },

    status: { type: String, enum: ["pending", "processed", "failed"], default: "pending", index: true },

    image: { publicId: { type: String }, url: { type: String } },

    ocrTriedAt: { type: Date, default: null },
    ocrError: { type: String, default: null },

    // === SIEMPRE BSON Double ===
    // (Mongoose no tiene tipo "Double"; usamos Mixed + setters/getters)
    total: {
      type: Schema.Types.Mixed,
      set: toDouble,
      get: fromDouble,
      validate: {
        validator: (v: any) => v == null || Number((v.valueOf?.() ?? v)) >= 0,
        message: "total debe ser >= 0",
      },
    },

    metodoPago: { type: String },
    estacion: { type: EstacionSchema, default: undefined },
    lineas: { type: [LineItemSchema], default: undefined },

    // Peaje (también Double)
    importe: {
      type: Schema.Types.Mixed,
      set: toDouble,
      get: fromDouble,
      validate: {
        validator: (v: any) => v == null || Number((v.valueOf?.() ?? v)) >= 0,
        message: "importe debe ser >= 0",
      },
    },
    autopista: { type: String },
    formaPago: { type: String },
    referencia: { type: String, default: null },
    provincia: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// índices
ticketSchema.index({ companyId: 1, userId: 1, fecha: -1 });
ticketSchema.index({ userId: 1, fecha: -1 });
ticketSchema.index(
  { domain: 1, idPropioTicket: 1 },
  { unique: true, partialFilterExpression: { idPropioTicket: { $type: "string" } } }
);

export const Ticket = model<TicketProps>("Ticket", ticketSchema);
