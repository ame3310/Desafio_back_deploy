import { dataApi } from "@modules/reports/dataApi.client";

type ChartParamsBase = {
  empresaNombre: string;
  start?: string;
  end?: string;
};

function toQuery({ empresaNombre, start, end }: ChartParamsBase) {
  const q: Record<string, string> = { empresa: empresaNombre };
  if (start) q.start_date = start;
  if (end) q.end_date = end;
  return q;
}

export async function llamadaParaGastoMesEmpAll(p: ChartParamsBase) {
  const { data } = await dataApi.get("/charts/all/empresa/gasto_mes_emp_all", {
    params: toQuery(p),
  });
  return data;
}

export async function llamadaParaRankingVehiculosCombustible(
  p: ChartParamsBase
) {
  const { data } = await dataApi.get(
    "/charts/combustible/empresa/ranking_veh",
    { params: toQuery(p) }
  );
  return data;
}

// Añadir charts necesarios
