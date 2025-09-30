import { ERR } from "@shared/constants/error.constants";
import { ApiError } from "@shared/errors/apiError";
import axios, { type AxiosInstance } from "axios";
import FormData from "form-data";
import http from "http";
import https from "https";

const baseURL = process.env.OCR_API_BASE ?? "";
const timeout = Number(process.env.OCR_TIMEOUT_MS ?? 120000);
const apiKey = process.env.OCR_API_KEY ?? "";

export type OcrDomain = "gasolineras" | "peaje";

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

export const ocrApi: AxiosInstance = axios.create({
  baseURL,
  timeout: Number(process.env.OCR_TIMEOUT_MS ?? 240_000),
  maxContentLength: Infinity,
  httpAgent,
  httpsAgent,
  headers: apiKey ? { "API-Key": apiKey } : {},
  validateStatus: () => true,
});

export async function callOcrProvider(params: {
  domain: OcrDomain;
  filename: string;
  fileBuffer: Buffer;
  contentType: string; // "image/png" | "image/jpeg" | "application/pdf"
}): Promise<unknown> {
  if (!baseURL)
    throw ApiError.ocr(
      "OCR_API_BASE ausente en entorno",
      ERR.OCR.OCR_NO_API_BASE_URL
    );
  if (!apiKey)
    throw ApiError.ocr(
      "OCR_API_KEY ausente en entorno",
      ERR.OCR.OCR_NO_API_KEY
    );

  const form = new FormData();
  form.append("file", params.fileBuffer, {
    filename: params.filename,
    contentType: params.contentType,
  });

  const path = params.domain === "peaje" ? "/peaje/" : "/gasolineras/";
  const url = baseURL.replace(/\/+$/, "") + path;

  try {
    console.log(
      "[OCR] POST",
      url,
      "timeout:",
      timeout,
      "file:",
      params.filename
    );
    const { data } = await ocrApi.post(path, form, {
      headers: {
        ...form.getHeaders(),
        "API-key": apiKey,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  } catch (err: any) {
    if (err?.response) {
      console.error("[OCR ERROR]", err.response.status, err.response.data);
    } else {
      console.error("[OCR ERROR]", err?.message ?? err);
    }
    throw err;
  }
}
