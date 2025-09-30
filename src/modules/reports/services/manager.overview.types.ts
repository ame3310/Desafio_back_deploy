export type PeriodoEmpresa = {
  empresaNombre: string; 
  start_date: string;     
  end_date: string;        
};
export type PieSlice = { label: "combustible" | "ev" | "peaje"; total: number };
export type UserTotal = { idUsuario: string; total: number };
