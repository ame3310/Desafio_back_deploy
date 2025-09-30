import axios, {
  type AxiosInstance,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

const baseURL = process.env.DATA_API_BASE ?? "";
const apiKey  = process.env.DATA_API_KEY  ?? "";  

export const dataApi: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
});

dataApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!apiKey) return config;

  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : AxiosHeaders.from(config.headers ?? {});

  headers.set("x-api-key", apiKey);
  config.headers = headers;
  return config;
});
