import { dataApi } from "@modules/reports/dataApi.client";
import type { KpisAllParams, KpisAllResponse } from "@modules/reports/dataApi.types";

export async function fetchKpisAll(params: KpisAllParams): Promise<KpisAllResponse> {
  const { data } = await dataApi.get<KpisAllResponse>("/kpis/all", { params });
  return data;
}
