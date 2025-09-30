import { Types } from "mongoose";
import { Ticket } from "@modules/tickets/ticket.model";
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
  } catch (err: any) {
    const status = err?.response?.status ?? 502;
    const detail = err?.response?.data ?? err?.message ?? "OCR error";
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

  const kind = detectFuelOrEvFromOcr(ocr);

  const ctx = {
    userId: new Types.ObjectId(user.id),
    companyId: user.companyId ? new Types.ObjectId(user.companyId) : null,
    fecha,
    source: "ocr" as const,
  };

  if (kind === "ev") {
    const patch = mapEvToTicketPatch(ocr, ctx);
    const doc = await Ticket.create({ domain: "ev", image, ...patch });
    return { ticketId: doc._id, domain: "ev" as const };
  } else {
    const patch = mapFuelToTicketPatch(ocr, ctx);
    const doc = await Ticket.create({ domain: "combustible", image, ...patch });
    return { ticketId: doc._id, domain: "combustible" as const };
  }
}

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
  } catch (err: any) {
    const status = err?.response?.status ?? 502;
    const detail = err?.response?.data ?? err?.message ?? "OCR error";
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
  const patch = mapTollToTicketPatch(ocr, ctx);

  const doc = await Ticket.create({ domain: "peaje", image, ...patch });
  return { ticketId: doc._id, domain: "peaje" as const };
}
