import type { OcrDomain } from "@modules/ocr/ocr.api.client";

export type OcrJobPayload = {
  ticketId: string;
  domain: OcrDomain;
  filename: string;
  contentType: string;
  filePath?: string;
  fileInlineBase64?: string;
};
