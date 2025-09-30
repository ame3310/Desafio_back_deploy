export type OcrJobData = {
  ticketId: string;
  imageUrl: string;
  domain: "combustible" | "ev" | "peaje";
};
export const OCR_QUEUE_NAME = "ocr-tickets";
