import { dataApi } from "@modules/reports/dataApi.client";
import { z } from "zod";

const EmpresaNombre = z.string().min(1);

const GastoTotalEmp = z.object({
  empresa: z.string(),
  gasto_total_periodo: z.number(),
});
const RankingVeh = z.object({
  empresa: z.string(),
  idUsuario: z.string(),
  gasto_usuario: z.number(),
});
const GastoEmpUserMesPeaje = z.object({
  empresa: z.string(),
  idUsuario: z.string(),
  gasto_mes: z.number(),
});

const KpisAllSchema = z.object({
  combustible: z.object({
    gasto_total_emp: z.array(GastoTotalEmp),
    ranking_veh: z.array(RankingVeh),
  }),
  ev: z.object({
    gasto_total_emp: z.array(GastoTotalEmp),
    ranking_veh: z.array(RankingVeh),
  }),
  peaje: z.object({
    gasto_total_emp: z.array(
      z.object({ empresa: z.string(), gasto_total_periodo: z.number() })
    ),
    gasto_emp_user_mes: z.array(GastoEmpUserMesPeaje),
  }),
});

type KpisAll = z.infer<typeof KpisAllSchema>;

export async function llamadaParaPieChartGastosTotalesEmpresaPorTipo(params: {
  empresaNombre: string;
  startYYYYMM: string;
}) {
  const { empresaNombre, startYYYYMM } = params;

  const { data } = await dataApi.get("/kpis/all", {
    params: {
      empresa: EmpresaNombre.parse(empresaNombre),
      start_date: startYYYYMM,
      fields: "gasto_total_emp",
    },
  });

  const kpis = KpisAllSchema.pick({
    combustible: true,
    ev: true,
    peaje: true,
  }).parse(data) as Pick<KpisAll, "combustible" | "ev" | "peaje">;

  return [
    {
      tipo: "combustible",
      total: kpis.combustible.gasto_total_emp[0]?.gasto_total_periodo ?? 0,
    },
    { tipo: "ev", total: kpis.ev.gasto_total_emp[0]?.gasto_total_periodo ?? 0 },
    {
      tipo: "peaje",
      total: kpis.peaje.gasto_total_emp[0]?.gasto_total_periodo ?? 0,
    },
  ] as Array<{ tipo: "combustible" | "ev" | "peaje"; total: number }>;
}

export async function llamadaParaRankingUsuariosEmpresa(params: {
  empresaNombre: string;
  startYYYYMM: string;
}) {
  const { empresaNombre, startYYYYMM } = params;

  const { data } = await dataApi.get("/kpis/all", {
    params: {
      empresa: EmpresaNombre.parse(empresaNombre),
      start_date: startYYYYMM,
      fields: "ranking_veh,gasto_emp_user_mes",
    },
  });

  const parsed = KpisAllSchema.parse(data);
  const acc = new Map<string, number>();

  for (const r of parsed.combustible.ranking_veh) {
    acc.set(r.idUsuario, (acc.get(r.idUsuario) ?? 0) + r.gasto_usuario);
  }
  for (const r of parsed.ev.ranking_veh) {
    acc.set(r.idUsuario, (acc.get(r.idUsuario) ?? 0) + r.gasto_usuario);
  }
  for (const r of parsed.peaje.gasto_emp_user_mes) {
    acc.set(r.idUsuario, (acc.get(r.idUsuario) ?? 0) + r.gasto_mes);
  }

  return [...acc.entries()]
    .map(([idUsuario, total]) => ({ idUsuario, total }))
    .sort((a, b) => b.total - a.total);
}
