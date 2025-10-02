import { Types } from "mongoose";
import { ManagerOverview } from "@read-models/managers/manager-overview.model";

type BreakdownItem = { type: "fuel" | "electric" | "toll"; total: number };
type RankItem = { userId: Types.ObjectId; total: number };

type ManagerRMLean = {
  yearMonth: string;
  totals: { fuel: number; tolls: number; electric: number; grandTotal: number };
  breakdownByType?: BreakdownItem[];
  rankingUsers?: RankItem[];
  updatedAt: Date;
};

function ym(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// "2025-10" -> Date primero de mes (local)
function parseMonthRef(m?: string): Date {
  if (!m) return new Date();
  const [y, mm] = m.split("-").map(Number);
  if (!y || !mm || mm < 1 || mm > 12) return new Date();
  return new Date(y, mm - 1, 1);
}

function ytdKeysFrom(monthRef: Date): string[] {
  const y = monthRef.getFullYear();
  const upto = monthRef.getMonth(); // 0..11
  const keys: string[] = [];
  for (let i = 0; i <= upto; i++) {
    const mm = String(i + 1).padStart(2, "0");
    keys.push(`${y}-${mm}`);
  }
  return keys;
}

/**
 * Manager overview
 * - month: mes pedido (o actual si no se pasa)
 * - totalsMonth: totales del mes
 * - totalsYtd:   sumatorio enero -> mes
 * - breakdownByTypeMonth, rankingUsersMonth
 * - (compat) seriePorMes/pie/ranking si luego quieres derivarlo en controller
 */
export async function getManagerOverviewRM(args: {
  companyId: string;
  month?: string; // "YYYY-MM" opcional
  top?: number;   // ranking size (default 10)
}) {
  const { companyId, month, top = 10 } = args;
  const company = new Types.ObjectId(companyId);

  const ref = parseMonthRef(month);
  const monthKey = ym(ref);
  const ytdKeys = ytdKeysFrom(ref);

  // Mes solicitado
  const thisMonth = await ManagerOverview.findOne({
    companyId: company,
    yearMonth: monthKey,
  })
    .select({
      yearMonth: 1,
      totals: 1,
      breakdownByType: 1,
      rankingUsers: 1,
      updatedAt: 1,
    })
    .lean<ManagerRMLean | null>();

  // YTD del año del mes solicitado
  const ytdAgg = await ManagerOverview.aggregate([
    { $match: { companyId: company, yearMonth: { $in: ytdKeys } } },
    {
      $group: {
        _id: null,
        fuel: { $sum: "$totals.fuel" },
        electric: { $sum: "$totals.electric" },
        tolls: { $sum: "$totals.tolls" },
        grandTotal: { $sum: "$totals.grandTotal" },
      },
    },
  ]);

  const totalsYtd =
    ytdAgg[0]
      ? {
          fuel: ytdAgg[0].fuel ?? 0,
          electric: ytdAgg[0].electric ?? 0,
          tolls: ytdAgg[0].tolls ?? 0,
          grandTotal: ytdAgg[0].grandTotal ?? 0,
        }
      : { fuel: 0, electric: 0, tolls: 0, grandTotal: 0 };

  return {
    month: monthKey,
    totalsMonth:
      thisMonth?.totals ?? { fuel: 0, electric: 0, tolls: 0, grandTotal: 0 },
    totalsYtd,
    breakdownByTypeMonth: thisMonth?.breakdownByType ?? [],
    rankingUsersMonth: (thisMonth?.rankingUsers ?? [])
      .slice(0, top)
      .map((r) => ({ userId: r.userId.toString(), total: r.total })),
  };
}
