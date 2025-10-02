export type CombustibleLinea = {
  producto: string;
  litros?: number;
  precioUnitario?: number;
  importe: number;
};

export type CombustibleDoc = {
  idEmpresa: string;
  idUsuario: string;
  fechaEmision: string; 
  horaEmision?: string; 
  metodoPago?: string;
  moneda?: string;
  estacion?: { nombre?: string; provincia?: string };
  lineas?: CombustibleLinea[];
};

export type PeajeDoc = {
  idEmpresa: string;
  idUsuario: string;
  fechaHora: string;
  importe: string;
  autopista?: string;
  provincia?: string;
  formaPago?: string;
};

export type ElectricoLinea = { importe: number };

export type ElectricoDoc = {
  idEmpresa: string;
  idUsuario: string;
  fechaEmision: string;
  horaEmision?: string;
  metodoPago?: string;
  moneda?: string;
  estacion?: { nombre?: string; provincia?: string };
  lineas?: ElectricoLinea[];
};
