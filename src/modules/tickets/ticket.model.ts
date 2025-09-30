import { Schema, model } from "mongoose";
import type { TicketProps } from "@modules/tickets/ticket.types";

const ticketSchema = new Schema<TicketProps>(
  {
    domain: {
      type: String,
      enum: ["combustible", "ev", "peaje"],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    fecha: { type: Date, required: true, index: true },
    idPropioTicket: { type: String, default: null },
    source: { type: String },

    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true,
    },
    image: { publicId: { type: String }, url: { type: String } },
    ocrTriedAt: { type: Date, default: null },
    ocrError: { type: String, default: null },

    total: { type: Number },
    metodoPago: { type: String },
    estacion: { type: Schema.Types.Mixed },
    lineas: { type: [Schema.Types.Mixed] },

    importe: { type: Number },
    autopista: { type: String },
    formaPago: { type: String },
    referencia: { type: String, default: null },
    provincia: { type: String },
  },
  { timestamps: true, versionKey: false }
);

ticketSchema.index({ companyId: 1, userId: 1, fecha: 1 });
ticketSchema.index({ userId: 1, fecha: -1 });
ticketSchema.index(
  { domain: 1, idPropioTicket: 1 },
  {
    unique: true,
    partialFilterExpression: { idPropioTicket: { $type: "string" } },
  }
);

export const Ticket = model<TicketProps>("Ticket", ticketSchema);
