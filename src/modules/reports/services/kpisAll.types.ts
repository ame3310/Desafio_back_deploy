export type KpisAllParams = {
  empresa: string;
  start_date?: string;
  end_date?: string;
  idUsuario?: string;
  fields?: string;
};

export type GastoTotalEmp = { gasto_total_periodo: number };
export type RankingVeh = { idUsuario: string; gasto_usuario: number };
export type GastoEmpUserMesPeaje = { idUsuario: string; gasto_mes: number };

export type KpisAllResponse = {
  combustible: {
    gasto_total_emp?: GastoTotalEmp[];
    ranking_veh?: RankingVeh[];
  };
  ev: {
    gasto_total_emp?: GastoTotalEmp[];
    ranking_veh?: RankingVeh[];
  };
  peaje: {
    gasto_total_emp?: GastoTotalEmp[];
    gasto_emp_user_mes?: GastoEmpUserMesPeaje[];
  };
};
