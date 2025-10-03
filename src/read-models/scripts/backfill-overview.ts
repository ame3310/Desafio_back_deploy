import "dotenv/config";
import mongoose, { Types } from "mongoose";

import { Ticket } from "../../modules/tickets/ticket.model";
import { UserOverview } from "../users/user-overview.model";
import { ManagerOverview } from "../managers/manager-overview.model";
import {
  TicketProps,
  FuelTicketProps,
  EvTicketProps,
} from "../../modules/tickets/ticket.types";

type Totals = {
  fuel: number;
  electric: number;
  tolls: number;
  grandTotal: number;
};
type Counts = { tickets: number };

function ym(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function firstDay(month: string): Date {
  const [y, mm] = month.split("-").map(Number);
  if (!y || !mm || mm < 1 || mm > 12)
    throw new Error(`month inválido: ${month}`);
  return new Date(y, mm - 1, 1);
}
function nextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
function monthsBetweenInclusive(from: string, to: string): string[] {
  const a = firstDay(from);
  const b = firstDay(to);
  if (a > b) throw new Error(`Rango inválido: ${from}..${to}`);
  const out: string[] = [];
  let cur = new Date(a);
  while (cur <= b) {
    out.push(ym(cur));
    cur = nextMonth(cur);
  }
  return out;
}

function isFuel(t: TicketProps): t is FuelTicketProps {
  return t.domain === "combustible";
}
function isEv(t: TicketProps): t is EvTicketProps {
  return t.domain === "ev";
}

function amountFromTicket(t: TicketProps): number {
  if (t.domain === "peaje") return t.importe ?? 0;

  if (isFuel(t)) {
    const l0 = t.lineas?.[0];
    if (typeof l0?.importe === "number") return l0.importe;
    if (
      typeof l0?.litros === "number" &&
      typeof l0?.precioPorLitro === "number"
    ) {
      return l0.litros * l0.precioPorLitro;
    }
    return t.total ?? 0;
  }

  if (isEv(t)) {
    const l0 = t.lineas?.[0];
    if (typeof l0?.importe === "number") return l0.importe;
    if (typeof l0?.kwh === "number" && typeof l0?.precio_kwh === "number") {
      return l0.kwh * l0.precio_kwh;
    }
    return t.total ?? 0;
  }

  return 0;
}

async function backfillCompanyMonth(companyId: Types.ObjectId, month: string) {
  const from = firstDay(month);
  const to = nextMonth(from);
  const yearMonth = ym(from);

  const tickets = await Ticket.find({
    companyId,
    fecha: { $gte: from, $lt: to },
  })
    .lean<TicketProps[]>()
    .exec();

  type PerUser = Record<string, { totals: Totals; counts: Counts }>;
  const perUser: PerUser = {};
  const companyTotals: Totals = {
    fuel: 0,
    electric: 0,
    tolls: 0,
    grandTotal: 0,
  };
  const perUserTotalForRank: Record<string, number> = {};

  for (const t of tickets) {
    const userKey = String(t.userId);
    const amt = amountFromTicket(t);

    if (!perUser[userKey]) {
      perUser[userKey] = {
        totals: { fuel: 0, electric: 0, tolls: 0, grandTotal: 0 },
        counts: { tickets: 0 },
      };
    }
    const u = perUser[userKey];
    u.counts.tickets += 1;

    if (t.domain === "combustible") {
      u.totals.fuel += amt;
      companyTotals.fuel += amt;
    } else if (t.domain === "ev") {
      u.totals.electric += amt;
      companyTotals.electric += amt;
    } else if (t.domain === "peaje") {
      u.totals.tolls += amt;
      companyTotals.tolls += amt;
    }

    u.totals.grandTotal = u.totals.fuel + u.totals.electric + u.totals.tolls;
    perUserTotalForRank[userKey] = (perUserTotalForRank[userKey] ?? 0) + amt;
  }

  companyTotals.grandTotal =
    companyTotals.fuel + companyTotals.electric + companyTotals.tolls;

  const ops = Object.entries(perUser).map(([userId, data]) => ({
    updateOne: {
      filter: { companyId, userId: new Types.ObjectId(userId), yearMonth },
      update: {
        $setOnInsert: {
          companyId,
          userId: new Types.ObjectId(userId),
          yearMonth,
        },
        $set: {
          totals: data.totals,
          counts: data.counts,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));
  if (ops.length) await UserOverview.bulkWrite(ops);

  const breakdownByType = [
    { type: "fuel" as const, total: companyTotals.fuel },
    { type: "electric" as const, total: companyTotals.electric },
    { type: "tolls" as const, total: companyTotals.tolls },
  ];
  const rankingUsers = Object.entries(perUserTotalForRank)
    .map(([userId, total]) => ({ userId: new Types.ObjectId(userId), total }))
    .sort((a, b) => b.total - a.total);

  await ManagerOverview.updateOne(
    { companyId, yearMonth },
    {
      $setOnInsert: { companyId, yearMonth },
      $set: {
        totals: companyTotals,
        breakdownByType,
        rankingUsers,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

function parsePeriodArg(arg: string): string[] {
  const ymd = /^\d{4}-\d{2}$/;
  const range = /^(\d{4}-\d{2})\.\.(\d{4}-\d{2})$/;
  const year = /^\d{4}$/;

  if (arg === "ytd") {
    const now = new Date();
    const start = `${now.getFullYear()}-01`;
    const end = ym(now);
    return monthsBetweenInclusive(start, end);
  }
  if (ymd.test(arg)) return [arg];

  const r = range.exec(arg);
  if (r) return monthsBetweenInclusive(r[1], r[2]);

  const y = year.exec(arg);
  if (y) return monthsBetweenInclusive(`${y[0]}-01`, `${y[0]}-12`);

  throw new Error(
    `Periodo inválido "${arg}". Usa: YYYY-MM | YYYY-MM..YYYY-MM | YYYY | ytd`
  );
}

async function run(companyIdStr: string, periodArg: string) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("Falta MONGO_URI en .env");
  await mongoose.connect(mongoUri);

  const companyId = new Types.ObjectId(companyIdStr);
  const months = parsePeriodArg(periodArg);

  for (const m of months) {
    console.log(`Recalculando ${m}…`);
    await UserOverview.deleteMany({ companyId, yearMonth: m });
    await ManagerOverview.deleteOne({ companyId, yearMonth: m });
    await backfillCompanyMonth(companyId, m);
  }
  await mongoose.disconnect();
}

(async () => {
  const companyId = process.argv[2];
  const period = process.argv[3];
  if (!companyId || !period) {
    console.error(
      "Uso: npm run backfill -- <companyId> <YYYY-MM | YYYY-MM..YYYY-MM | YYYY | ytd>"
    );
    process.exit(1);
  }
  run(companyId, period)
    .then(() => (console.log("Backfill OK"), process.exit(0)))
    .catch((e) => (console.error("Backfill ERROR:", e), process.exit(1)));
})();
