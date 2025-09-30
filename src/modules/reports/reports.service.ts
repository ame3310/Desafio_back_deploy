import { dataApi } from "@modules/reports/dataApi.client";
import type {
  ChartDomain,
  ChartSection,
  ChartRow,
} from "@modules/reports/dataApi.types";

/**
 * Función base para /charts/{domain}/{section}/{field}
 */
export async function fetchChart({
  domain,
  section,
  field,
  query,
}: {
  domain: ChartDomain;
  section: ChartSection;
  field: string;
  query?: Record<string, string | number | undefined>;
}): Promise<ChartRow[]> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    params[k] = String(v);
  }
  const url = `/charts/${domain}/${section}/${field}`;
  const { data } = await dataApi.get<ChartRow[]>(url, { params });
  return Array.isArray(data) ? data : [];
}

export async function llamadaParaPieChartGastosTotalesEmpresaPorTipo({
  idEmpresa,
  start_date,
  end_date,
  field,
}: {
  idEmpresa: string;
  start_date: string;
  end_date: string;
  field: string;
}) {
  return fetchChart({
    domain: "all",
    section: "empresa",
    field,
    query: {
      empresa: idEmpresa,
      start_date,
      end_date,
    },
  });
}

export async function llamadaParaGastoTotalPorUsuarioDeMismaEmpresa({
  idEmpresa,
  start_date,
  end_date,
  field,
}: {
  idEmpresa: string;
  start_date: string;
  end_date: string;
  field: string;
}) {
  return fetchChart({
    domain: "all",
    section: "empresa",
    field,
    query: {
      empresa: idEmpresa,
      start_date,
      end_date,
    },
  });
}

export async function llamadaParaGastoMensualCombustibleUsuario({
  idUsuario,
  start_date,
  end_date,
  field, // "gasto_usuario_mes" | "tickets_usuario_mes" | "litros_usuario_mes" etc
}: {
  idUsuario: string;
  start_date: string;
  end_date: string;
  field: string;
}) {
  return fetchChart({
    domain: "combustible",
    section: "usuario",
    field,
    query: {
      idUsuario,
      start_date,
      end_date,
    },
  });
}
