import type { Types } from "mongoose";
import type {
  FuelTicketProps,
  EvTicketProps,
  TollTicketProps,
} from "@modules/tickets/ticket.types";

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toNumber(x: unknown): number | undefined {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const cleaned = x.replace?.(/[€\s]/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function pickNumber(obj: unknown, key: string): number | undefined {
  if (!isRecord(obj)) return undefined;
  return toNumber((obj as AnyRecord)[key]);
}

function pickString(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const v = (obj as AnyRecord)[key];
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

export type OcrKind = "fuel" | "ev" | "toll";

export function detectFuelOrEvFromOcr(ocrJson: unknown): OcrKind {
  const kwh = pickNumber(ocrJson, "kwh");
  if (kwh && kwh > 0) return "ev";

  const litros = pickNumber(ocrJson, "litros");
  const ppl = pickNumber(ocrJson, "precioPorLitro");
  if ((litros && litros > 0) || (ppl && ppl > 0)) return "fuel";

  return "fuel";
}

type CommonCtx = {
  userId: Types.ObjectId;
  companyId?: Types.ObjectId | null;
  fecha: Date;
  source: string; 
};

export function mapFuelToTicketPatch(
  ocr: unknown,
  ctx: CommonCtx
): Partial<Omit<FuelTicketProps, "domain">> {
  const total       = pickNumber(ocr, "total") ?? 0;
  const metodoPago  = pickString(ocr, "metodoPago");
  const provincia   = pickString(ocr, "provincia");
  const estacionNom = pickString(ocr, "estacionNombre");

  const litros      = pickNumber(ocr, "litros");
  const ppl         = pickNumber(ocr, "precioPorLitro");
  const importe     = pickNumber(ocr, "importe");

  return {
    userId: ctx.userId,
    companyId: ctx.companyId ?? null,
    fecha: ctx.fecha,
    idPropioTicket: pickString(ocr, "idTicket") ?? null,
    source: ctx.source,
    total,
    metodoPago,
    estacion: (estacionNom || provincia)
      ? { nombre: estacionNom, provincia }
      : undefined,
    lineas: (litros || ppl || importe)
      ? [{ producto: "Combustible", litros, precioPorLitro: ppl, importe }]
      : undefined,
  };
}

export function mapEvToTicketPatch(
  ocr: unknown,
  ctx: CommonCtx
): Partial<Omit<EvTicketProps, "domain">> {
  const total       = pickNumber(ocr, "total") ?? 0;
  const metodoPago  = pickString(ocr, "metodoPago");
  const provincia   = pickString(ocr, "provincia");
  const tarifa      = pickString(ocr, "tarifa");
  const potenciaKW  = pickNumber(ocr, "potenciaMaxKW");

  const kwh         = pickNumber(ocr, "kwh");
  const precio_kwh  =
    pickNumber(ocr, "precio_kwh") ?? pickNumber(ocr, "precioUnitario");

  return {
    userId: ctx.userId,
    companyId: ctx.companyId ?? null,
    fecha: ctx.fecha,
    idPropioTicket: pickString(ocr, "idTicket") ?? null,
    source: ctx.source,
    total,
    metodoPago,
    estacion: (provincia || tarifa || potenciaKW)
      ? { provincia, tarifa, potenciaMaxKW: potenciaKW }
      : undefined,
    lineas: (kwh || precio_kwh)
      ? [{ producto: "Electricidad", kwh, precio_kwh }]
      : undefined,
  };
}

export function mapTollToTicketPatch(
  ocr: unknown,
  ctx: CommonCtx
): Partial<Omit<TollTicketProps, "domain">> {
  return {
    userId: ctx.userId,
    companyId: ctx.companyId ?? null,
    fecha: ctx.fecha,
    idPropioTicket: pickString(ocr, "idTicket") ?? pickString(ocr, "referencia") ?? null,
    source: ctx.source,
    importe: pickNumber(ocr, "importe") ?? 0,
    autopista: pickString(ocr, "autopista"),
    formaPago: pickString(ocr, "formaPago"),
    referencia: pickString(ocr, "referencia") ?? null,
    provincia: pickString(ocr, "provincia"),
  };
}
