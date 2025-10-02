import { Types } from "mongoose";
import { UserOverview } from "@read-models/users/user-overview.model";
import { ManagerOverview } from "@read-models/managers/manager-overview.model";
import { Ticket } from "@modules/tickets/ticket.model";

// YYYY-MM
function ym(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Proyector incremental al CREAR un ticket:
 * - Actualiza rm_user_overview y rm_manager_overview (upsert + $inc)
 * - Recalcula (sólo ese mes) breakdownByType y rankingUsers desde tickets
 *
 * domain: "combustible" | "ev" | "peaje"
 * amount: importe monetario a agregar (fuel/ev = total; peaje = importe)
 */
export async function onTicketCreated(args: {
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  fecha: Date;
  domain: "combustible" | "ev" | "peaje";
  amount: number;
}) {
  const { companyId, userId, fecha, domain, amount } = args;
  const yearMonth = ym(fecha);

  // domain -> campo del RM
  const field =
    domain === "peaje" ? "tolls" : domain === "ev" ? "electric" : "fuel";

  // ---- USER RM (por usuario y mes) ----
  await UserOverview.updateOne(
    { companyId, userId, yearMonth },
    {
      $inc: {
        "totals.grandTotal": amount,
        [`totals.${field}`]: amount,
        "counts.tickets": 1,
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );

  // ---- MANAGER RM (por empresa y mes) ----
  await ManagerOverview.updateOne(
    { companyId, yearMonth },
    {
      $inc: {
        "totals.grandTotal": amount,
        [`totals.${field}`]: amount,
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );

  // Recomputar desglose y ranking del mes (empresa)
  await refreshManagerMonth(companyId, yearMonth);
}

/**
 * Recomputar breakdownByType y rankingUsers para companyId+yearMonth usando TICKETS.
 * Calcula amount = IFNULL(importe, total, 0) para robustez.
 */
async function refreshManagerMonth(
  companyId: Types.ObjectId,
  yearMonth: string
) {
  const base = [
    {
      $addFields: {
        yearMonth: { $dateToString: { format: "%Y-%m", date: "$fecha" } },
      },
    },
    { $match: { companyId, yearMonth } },
    {
      $project: {
        domain: 1, // "combustible" | "ev" | "peaje"
        userId: 1,
        amount: { $ifNull: ["$importe", { $ifNull: ["$total", 0] }] },
      },
    },
  ] as any[];

  // Totales por tipo
  const byTypeRaw = await Ticket.aggregate([
    ...base,
    { $group: { _id: "$domain", total: { $sum: "$amount" } } },
  ]);

  const breakdownByType = byTypeRaw.map(
    (x: { _id: string; total: number }) => ({
      type: x._id === "peaje" ? "toll" : x._id === "ev" ? "electric" : "fuel",
      total: x.total ?? 0,
    })
  );

  // Ranking de usuarios (Top 10)
  const byUser = await Ticket.aggregate([
    ...base,
    { $group: { _id: "$userId", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  await ManagerOverview.updateOne(
    { companyId, yearMonth },
    {
      $set: {
        breakdownByType,
        rankingUsers: byUser.map((x: any) => ({
          userId: x._id,
          total: x.total ?? 0,
        })),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}
