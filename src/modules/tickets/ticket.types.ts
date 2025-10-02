import { Types } from "mongoose";

export type TicketDomain = "combustible" | "ev" | "peaje";
export type TicketStatus = "pending" | "processed" | "failed";

export interface BaseTicketProps {
  domain: TicketDomain;
  userId: Types.ObjectId;
  companyId?: Types.ObjectId | null;
  empresaNombre?: string | null;
  fecha: Date;
  idPropioTicket?: string | null;
  source?: string;
  status: TicketStatus;
  image?: { publicId: string; url: string } | null;
  ocrTriedAt?: Date | null;
  ocrError?: string | null;
}

export interface FuelTicketProps extends BaseTicketProps {
  domain: "combustible";
  total?: number;
  metodoPago?: string;
  estacion?: { nombre?: string; provincia?: string } | null;
  lineas?: Array<{
    producto?: string;
    litros?: number;
    precioPorLitro?: number;
    importe?: number;
  }>;
}

export interface EvTicketProps extends BaseTicketProps {
  domain: "ev";
  total?: number;
  metodoPago?: string;
  estacion?: {
    provincia?: string;
    potenciaMaxKW?: number;
    tarifa?: string;
  } | null;
  lineas?: Array<{
    producto?: string;
    kwh?: number;
    precio_kwh?: number;
    importe?: number;
  }>;
}

export interface TollTicketProps extends BaseTicketProps {
  domain: "peaje";
  importe?: number;
  autopista?: string;
  formaPago?: string;
  referencia?: string | null;
  provincia?: string;
}

export type TicketProps = FuelTicketProps | EvTicketProps | TollTicketProps;
