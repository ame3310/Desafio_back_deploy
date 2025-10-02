import { Types } from "mongoose";
import { Ticket } from "@modules/tickets/ticket.model";
import { Company } from "@modules/company/company.model";
import { callOcrProvider } from "@modules/ocr/ocr.api.client";
import {
  detectFuelOrEvFromOcr,
  mapEvToTicketPatch,
  mapFuelToTicketPatch,
  mapTollToTicketPatch,
} from "@modules/ocr/ocr.parser";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";
import {
  uploadBufferToCloudinary,
  cloudinaryConfigured,
} from "@lib/cloudinary.client";

// Proyector: mantiene los read-models al crear un ticket
import { onTicketCreated } from "@read-models/projector/rm-projector";

type UserCtx = { id: string; companyId: string | null };
type FileArg = { originalname: string; mimetype: string; buffer: Buffer };

type CreateArgs = {
  file: FileArg;
  fecha: Date;
  user: UserCtx;
};

const ROOT = process.env.CLOUDINARY_ROOT || "tickets";

function buildFolder(user: UserCtx, fecha: Date) {
  const yy = String(fecha.getFullYear()).slice(-2);
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const ym = `${yy}-${mm}`;
  return `${ROOT}/${user.companyId ?? "no-company"}/${user.id}/${ym}`;
}

function normalizeEmpresaNombre(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

async function getEmpresaNombre(
  companyId: string | null
): Promise<string | null> {
  if (!companyId) return null;
  const c = await Company.findById(companyId).select("name").lean();
  return c?.name ? normalizeEmpresaNombre(c.name) : null;
}

/** ===== helpers de amount (sin any) ===== */
function amountFromFuel(patch: ReturnType<typeof mapFuelToTicketPatch>): number {
  const l = patch.lineas?.[0];
  if (typeof l?.importe === "number") return l.importe;
  if (typeof l?.litros === "number" && typeof l?.precioPorLitro === "number") {
    return l.litros * l.precioPorLitro;
  }
  return patch.total ?? 0;
}
function amountFromEv(patch: ReturnType<typeof mapEvToTicketPatch>): number {
  const l = patch.lineas?.[0];
  if (typeof l?.importe === "number") return l.importe;
  if (typeof l?.kwh === "number" && typeof l?.precio_kwh === "number") {
    return l.kwh * l.precio_kwh;
  }
  return patch.total ?? 0;
}
function amountFromToll(patch: ReturnType<typeof mapTollToTicketPatch>): number {
  return patch.importe ?? 0;
}

/** ===== GASOLINERAS (fuel/ev) ===== */
export async function createFromGasolineras(args: CreateArgs) {
  const { file, fecha, user } = args;

  let ocr: unknown;
  try {
    ocr = await callOcrProvider({
      domain: "gasolineras",
      filename: file.originalname,
      fileBuffer: file.buffer,
      contentType: file.mimetype,
    });
  } catch (err: unknown) {
    const e = err as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    const status = e?.response?.status ?? 502;
    const detail = e?.response?.data ?? e?.message ?? "OCR error";
    throw Object.assign(
      ApiError.ocr("OCR request failed", ERR.OCR.OCR_FAILED_REQUEST),
      { status, detail }
    );
  }

  let image: { url?: string; publicId?: string } = {};
  if (cloudinaryConfigured) {
    try {
      const res = await uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: buildFolder(user, fecha),
      });
      image = { url: res.secure_url, publicId: res.public_id };
      console.log("[Cloudinary] OK:", res.public_id);
    } catch (e) {
      console.error("[Cloudinary] Upload error:", e);
    }
  }

  const ctx = {
    userId: new Types.ObjectId(user.id),
    companyId: user.companyId ? new Types.ObjectId(user.companyId) : null,
    fecha,
    source: "ocr" as const,
  };

  const empresaNombre = await getEmpresaNombre(user.companyId);

  const kind = detectFuelOrEvFromOcr(ocr); // "fuel" | "ev"
  if (kind === "ev") {
    const patch = mapEvToTicketPatch(ocr, ctx);
    const doc = await Ticket.create({
      domain: "ev",
      image,
      empresaNombre,
      ...patch,
    });

    if (ctx.companyId) {
      const amount = amountFromEv(patch);
      await onTicketCreated({
        companyId: ctx.companyId,
        userId: ctx.userId,
        fecha: ctx.fecha,
        domain: "ev",
        amount,
      });
    }

    return { ticketId: doc._id, domain: "ev" as const };
  } else {
    const patch = mapFuelToTicketPatch(ocr, ctx);
    const doc = await Ticket.create({
      domain: "combustible",
      image,
      empresaNombre,
      ...patch,
    });

    if (ctx.companyId) {
      const amount = amountFromFuel(patch);
      await onTicketCreated({
        companyId: ctx.companyId,
        userId: ctx.userId,
        fecha: ctx.fecha,
        domain: "combustible",
        amount,
      });
    }

    return { ticketId: doc._id, domain: "combustible" as const };
  }
}

/** ===== PEAJE ===== */
export async function createFromPeaje(args: CreateArgs) {
  const { file, fecha, user } = args;

  let ocr: unknown;
  try {
    ocr = await callOcrProvider({
      domain: "peaje",
      filename: file.originalname,
      fileBuffer: file.buffer,
      contentType: file.mimetype,
    });
  } catch (err: unknown) {
    const e = err as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    const status = e?.response?.status ?? 502;
    const detail = e?.response?.data ?? e?.message ?? "OCR error";
    throw Object.assign(
      ApiError.ocr("OCR request failed", ERR.OCR.OCR_FAILED_REQUEST),
      { status, detail }
    );
  }

  let image: { url?: string; publicId?: string } = {};
  if (cloudinaryConfigured) {
    try {
      const res = await uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: buildFolder(user, fecha),
      });
      image = { url: res.secure_url, publicId: res.public_id };
      console.log("[Cloudinary] OK:", res.public_id);
    } catch (e) {
      console.error("[Cloudinary] Upload error:", e);
    }
  }

  const ctx = {
    userId: new Types.ObjectId(user.id),
    companyId: user.companyId ? new Types.ObjectId(user.companyId) : null,
    fecha,
    source: "ocr" as const,
  };

  const empresaNombre = await getEmpresaNombre(user.companyId);

  const patch = mapTollToTicketPatch(ocr, ctx);
  const doc = await Ticket.create({
    domain: "peaje",
    image,
    empresaNombre,
    ...patch,
  });

  if (ctx.companyId) {
    const amount = amountFromToll(patch);
    await onTicketCreated({
      companyId: ctx.companyId,
      userId: ctx.userId,
      fecha: ctx.fecha,
      domain: "peaje",
      amount,
    });
  }

  return { ticketId: doc._id, domain: "peaje" as const };
}
