import { ocrApi } from "@modules/ocr/ocr.api.client";
import FormData from "form-data";
import type { ReadStream } from "fs";

type OcrOk = unknown; 

async function postFile(
  endpoint: string,
  file: Buffer | ReadStream,
  filename = "ticket"
) {
  const form = new FormData();
  form.append("file", file, filename);

  const { data } = await ocrApi.post<OcrOk>(endpoint, form, {
    headers: form.getHeaders(),
  });
  return data;
}

export function extractCombustible(file: Buffer | ReadStream) {
  return postFile("/gasolineras/", file);
}

export function extractPeaje(file: Buffer | ReadStream) {
  return postFile("/peaje/", file);
}
