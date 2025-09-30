import { fetchKpisAll } from "@modules/reports/services/kpisAll.service";
import { Company } from "@modules/company/company.model";

export async function getUserFuelYtdAndSeriesFromData(params: {
  userId: string;
  companyId?: string | null;
  year: number;
}) {
  const { userId, companyId, year } = params;

  let empresaNombre: string | null = null;
  if (companyId) {
    const c = await Company.findById(companyId).select("name").lean();
    empresaNombre = c?.name ?? null;
  }

  if (!empresaNombre) {
    return {
      totalYtd: 0,
      series: Array.from({ length: 12 }, (_, i) => ({
        mes: `${year}-${String(i + 1).padStart(2, "0")}`,
        total: 0,
      })),
      fuente: "data-api" as const,
    };
  }

  const start_ym = `${year}-01`;

  const kpis = await fetchKpisAll({
    empresa: empresaNombre,
    start_date: start_ym,
    idUsuario: userId,
    fields: "gasto_emp_user_mes",
  });

  const rows = Array.isArray((kpis as any)?.combustible?.gasto_emp_user_mes)
    ? ((kpis as any).combustible.gasto_emp_user_mes as Array<{
        mes?: string;
        total?: number;
      }>)
    : [];

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const mes = typeof r.mes === "string" ? r.mes : null;
    const total = Number(r.total ?? 0);
    if (mes && mes.startsWith(String(year))) {
      byMonth.set(mes, (byMonth.get(mes) ?? 0) + total);
    }
  }

  const series = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const key = `${year}-${mm}`;
    return { mes: key, total: byMonth.get(key) ?? 0 };
  });

  const totalYtd = series.reduce((acc, x) => acc + x.total, 0);

  return { totalYtd, series, fuente: "data-api" as const };
}
