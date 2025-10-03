import { Types } from "mongoose";
import { UserOverview } from "@read-models/users/user-overview.model";
import { ManagerOverview } from "@read-models/managers/manager-overview.model";
import { Ticket } from "@modules/tickets/ticket.model";

function ym(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function onTicketCreated(args: {
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  fecha: Date;
  domain: "combustible" | "ev" | "peaje";
  amount: number;
}) {
  const { companyId, userId, fecha, domain, amount } = args;
  const yearMonth = ym(fecha);

  const field =
    domain === "peaje" ? "tolls" : domain === "ev" ? "electric" : "fuel";

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

  await refreshManagerMonth(companyId, yearMonth);
}

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
        domain: 1, 
        userId: 1,
        amount: { $ifNull: ["$importe", { $ifNull: ["$total", 0] }] },
      },
    },
  ] as any[];

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
