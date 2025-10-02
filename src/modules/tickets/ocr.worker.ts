import axios from "axios";
import { makeWorker } from "@lib/queue/bullmq";
import { OCR_QUEUE_NAME, type OcrJobData } from "@modules/tickets/ocr.job";
import { Ticket } from "@modules/tickets/ticket.model";

async function callOcr(imageUrl: string, domain: OcrJobData["domain"]) {
  const BASE = process.env.OCR_API_BASE ?? "";
  const KEY = process.env.OCR_API_KEY ?? "";
  const r = await axios.post<{ data: any }>(
    `${BASE}/ocr/parse`,
    { url: imageUrl, domain },
    {
      timeout: 30000,
      headers: KEY ? { "x-api-key": KEY } : undefined,
    }
  );
  return r.data.data;
}

makeWorker<OcrJobData>(OCR_QUEUE_NAME, async (job) => {
  const { ticketId, imageUrl, domain } = job.data;

  try {
    const parsed = await callOcr(imageUrl, domain);
    const set: Record<string, unknown> = {
      status: "processed",
      ocrTriedAt: new Date(),
      ocrError: null,
    };

    if (domain === "peaje") {
      set["importe"] = Number(parsed?.importe ?? 0);
      set["autopista"] = parsed?.autopista ?? undefined;
      set["formaPago"] = parsed?.formaPago ?? undefined;
      set["referencia"] = parsed?.referencia ?? null;
      set["provincia"] = parsed?.provincia ?? undefined;
    } else {
      set["total"] = Number(parsed?.total ?? 0);
      set["metodoPago"] = parsed?.metodoPago ?? undefined;
      set["estacion"] = parsed?.estacion ?? undefined;
      set["lineas"] = Array.isArray(parsed?.lineas) ? parsed.lineas : undefined;
    }

    await Ticket.findByIdAndUpdate(ticketId, { $set: set });
  } catch (e: any) {
    await Ticket.findByIdAndUpdate(ticketId, {
      $set: {
        status: "failed",
        ocrTriedAt: new Date(),
        ocrError: String(e?.message ?? e),
      },
    });
    throw e;
  }
});
