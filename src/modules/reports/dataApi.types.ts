export type ChartDomain = "combustible" | "ev" | "peaje" | "all";
export type ChartSection = "empresa" | "usuario";
export type ChartRow = Record<string, unknown>;
export type KpiRow = Record<string, unknown>;
export type KpisAllParams = {
  empresa: string;
  start_date?: string; 
  end_date?: string;   
  idUsuario?: string;
  fields?: string;     
};

export type GastoMesEmpRow = { empresa: string; mes: string; total: number };
export type GastoTotalEmpRow = { empresa: string; gasto_total_periodo: number };
export type VehiculosEmpRow = { empresa: string; num_vehiculos: number };
export type RankingVehRow = { empresa: string; idUsuario: string; gasto_usuario: number };

export type CombustibleKpis = Partial<{
  gasto_mes_emp: GastoMesEmpRow[];
  gasto_total_emp: GastoTotalEmpRow[];
  vehiculos_emp: VehiculosEmpRow[];
  gasto_medio_veh: { empresa: string; gasto_medio_por_vehiculo: number }[];
  ranking_veh: RankingVehRow[];
  litros_mes_emp: { empresa: string; mes: string; litros: number }[];
  litros_veh_emp: { empresa: string; idUsuario: string; litros: number }[];
  precio_global_emp: { empresa: string; eur_l: number }[];
  gasto_emp_user_mes: { empresa: string; idUsuario: string; mes: string; total: number }[];
  tickets_emp_user_mes: { empresa: string; idUsuario: string; mes: string; tickets: number }[];
  litros_emp_user_mes: { empresa: string; idUsuario: string; mes: string; litros: number }[];
  precio_emp_user: { empresa: string; idUsuario: string; eur_l: number }[];
  consumo_emp_user_mes: { empresa: string; idUsuario: string; mes: string; litros: number }[];
}>;

export type EvKpis = Partial<{
  gasto_mes_emp: { empresa: string; mes: string; total: number }[];
  gasto_total_emp: { empresa: string; gasto_total_periodo: number }[];
  vehiculos_emp: { empresa: string; num_vehiculos: number }[];
  gasto_medio_veh: { empresa: string; gasto_medio_por_vehiculo: number }[];
  ranking_veh: { empresa: string; idUsuario: string; gasto_usuario: number }[];
  kwh_mes_emp: { empresa: string; mes: string; kwh: number }[];
  kwh_veh_emp: { empresa: string; idUsuario: string; kwh: number }[];
  precio_global_emp: { empresa: string; eur_kwh: number }[];
  gasto_emp_user_mes: { empresa: string; idUsuario: string; mes: string; total: number }[];
  tickets_emp_user_mes: { empresa: string; idUsuario: string; mes: string; tickets: number }[];
  kwh_emp_user_mes: { empresa: string; idUsuario: string; mes: string; kwh: number }[];
  precio_emp_user: { empresa: string; idUsuario: string; eur_kwh: number }[];
  consumo_emp_user_mes: { empresa: string; idUsuario: string; mes: string; kwh: number }[];
}>;

export type PeajeKpis = Partial<{
  gasto_mes_emp: { empresa: string; mes: string; gasto_mes: number }[];
  tickets_mes_emp: { empresa: string; mes: string; tickets_mes: number }[];
  emp_autopista_mes: {
    empresa: string; mes: string; autopista: string;
    gasto_autopista_mes: number; tickets_autopista_mes: number;
    coste_medio_ticket: number; pct_gasto_empresa_mes: number;
  }[];
  met_emp_mes: { empresa: string; mes: string; formaPago: string; tickets: number; pct: number }[];
  gasto_total_emp: { empresa: string; gasto_total_periodo: number }[];
  vehiculos_emp: { empresa: string; num_vehiculos: number }[];
  gasto_medio_veh: { empresa: string; gasto_medio_por_vehiculo: number }[];
  pct_finde_emp: { empresa: string; pct_finde: number }[];
  gasto_emp_user_mes: { empresa: string; idUsuario: string; mes: string; gasto_mes: number }[];
  tickets_emp_user_mes: { empresa: string; idUsuario: string; mes: string; tickets_mes: number }[];
}>;

export type KpisAllResponse = {
  combustible: CombustibleKpis;
  ev: EvKpis;
  peaje: PeajeKpis;
};
