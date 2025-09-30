import { fetchKpisAll } from "@modules/reports/services/kpisAll.service";
import type { PieSlice, UserTotal } from "@modules/reports/services/manager.overview.types";

type PeriodoEmpresa = {
  empresaNombre: string;
  start_date: string;
  end_date: string;
};

export async function llamadaParaPieChartGastosTotalesEmpresaPorTipo(
  opts: PeriodoEmpresa
): Promise<PieSlice[]> {
  const kpis = await fetchKpisAll({
    empresa: opts.empresaNombre,
    start_date: opts.start_date,
    end_date: opts.end_date,
    fields: "gasto_total_emp",
  });

  const getTotal = (arr?: { gasto_total_periodo: number }[]) =>
    Array.isArray(arr) && arr[0]?.gasto_total_periodo
      ? Number(arr[0].gasto_total_periodo)
      : 0;

  return [
    {
      label: "combustible",
      total: getTotal(kpis.combustible.gasto_total_emp as any),
    },
    { label: "ev", total: getTotal(kpis.ev.gasto_total_emp as any) },
    { label: "peaje", total: getTotal(kpis.peaje.gasto_total_emp as any) },
  ];
}

export async function llamadaParaGastoTotalPorUsuarioDeMismaEmpresa(
  opts: PeriodoEmpresa
): Promise<UserTotal[]> {
  const kpis = await fetchKpisAll({
    empresa: opts.empresaNombre,
    start_date: opts.start_date,
    end_date: opts.end_date,
    fields: "ranking_veh,gasto_emp_user_mes",
  });

  const acc = new Map<string, number>();
  const add = (id: string, inc: number) =>
    acc.set(id, (acc.get(id) ?? 0) + inc);

  for (const r of (kpis.combustible.ranking_veh as any[]) ?? [])
    add(r.idUsuario, Number(r.gasto_usuario));

  for (const r of (kpis.ev.ranking_veh as any[]) ?? [])
    add(r.idUsuario, Number(r.gasto_usuario));

  for (const r of (kpis.peaje.gasto_emp_user_mes as any[]) ?? [])
    add(r.idUsuario, Number(r.gasto_mes));

  return [...acc.entries()]
    .map(([idUsuario, total]) => ({ idUsuario, total }))
    .sort((a, b) => b.total - a.total);
}
