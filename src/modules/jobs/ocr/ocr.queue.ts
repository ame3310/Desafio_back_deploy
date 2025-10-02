import { Queue } from "bullmq";
import { getRedisOptions } from "@config/redis";
import type { OcrJobPayload } from "@modules/ocr/ocr.types";

//Tickets por cola, si da tiempo
const connection = getRedisOptions();
export const ocrQueue = new Queue<OcrJobPayload>("ocr:process", { connection });

export async function enqueueOcrJob(job: OcrJobPayload): Promise<string> {
  const j = await ocrQueue.add("ocr", job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
  return j.id as string;
}
