import { Worker } from "bullmq";
import mongoose from "mongoose";
import { getRedisOptions } from "@config/redis";
import type { OcrJobPayload } from "@modules/ocr/ocr.types";
import { callOcrProvider } from "@modules/ocr/ocr.api.client";
import { Ticket } from "@modules/tickets/ticket.model";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";

//tickets encolados, si OCR_MODE=queue, si da tiempo
const mongoUri = process.env.MONGO_URI ?? "";
if (!mongoUri) {
  console.error("MONGO_URI requerido para el worker OCR");
  process.exit(1);
}
mongoose.connect(mongoUri).catch((e) => {
  console.error("Mongo connect error (worker):", e);
  process.exit(1);
});

const connection = getRedisOptions();

export const ocrWorker = new Worker<OcrJobPayload>(
  "ocr:process",
  async (job) => {
    const p = job.data;

    let buffer: Buffer | undefined;
    if (p.fileInlineBase64) {
      buffer = Buffer.from(p.fileInlineBase64, "base64");
    } else {
     
      throw  ApiError.ocr("Falta fuente del archivo para OCR", ERR.OCR.OCR_NO_FILE);
    }

    const ocr = await callOcrProvider({
      domain: p.domain,
      filename: p.filename,
      fileBuffer: buffer,
      contentType: p.contentType,
    });


    await Ticket.findByIdAndUpdate(
      p.ticketId,
      { $set: { source: "ocr", estacion: { raw: ocr } } },
      { new: false }
    );
    return { ok: true };
  },
  { connection }
);

ocrWorker.on("completed", (j) => console.log(`[OCR] Job ${j.id} OK`));
ocrWorker.on("failed", (j, err) => console.error(`[OCR] Job ${j?.id} failed:`, err?.message));
