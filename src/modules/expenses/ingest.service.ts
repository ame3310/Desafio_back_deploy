import { Expense } from "@modules/expenses/expense.model";
import type { CombustibleDoc, PeajeDoc, ElectricoDoc } from "@modules/expenses/ingest.types";

export async function ingestCombustible(doc: CombustibleDoc) {
  const fecha = new Date(`${doc.fechaEmision}T${doc.horaEmision ?? "00:00:00"}+01:00`);
  for (const l of doc.lineas ?? []) {
    await Expense.create({
      empresaId: doc.idEmpresa,
      usuarioId: doc.idUsuario,
      tipo: "combustible",
      fecha,
      importe: Number(l.importe),
      moneda: doc.moneda ?? "EUR",
      estacion: doc.estacion?.nombre,
      provincia: doc.estacion?.provincia,
      metodoPago: doc.metodoPago,
      origen: "combustible.api",
    });
  }
}

export async function ingestPeaje(doc: PeajeDoc) {
  const fecha = new Date(doc.fechaHora.replace(" ", "T") + "+01:00");
  const importe = Number(String(doc.importe).replace("€","").replace(",",".").trim());
  await Expense.create({
    empresaId: doc.idEmpresa,
    usuarioId: doc.idUsuario,
    tipo: "peaje",
    fecha,
    importe,
    moneda: "EUR",
    estacion: doc.autopista,
    provincia: doc.provincia,
    metodoPago: doc.formaPago,
    origen: "peaje.api",
  });
}

export async function ingestElectrico(doc: ElectricoDoc) {
  const fecha = new Date(`${doc.fechaEmision}T${doc.horaEmision ?? "00:00:00"}+01:00`);
  for (const l of doc.lineas ?? []) {
    await Expense.create({
      empresaId: doc.idEmpresa,
      usuarioId: doc.idUsuario,
      tipo: "electrico",
      fecha,
      importe: Number(l.importe),
      moneda: doc.moneda ?? "EUR",
      estacion: doc.estacion?.nombre,
      provincia: doc.estacion?.provincia,
      metodoPago: doc.metodoPago,
      origen: "electrico.api",
    });
  }
}
