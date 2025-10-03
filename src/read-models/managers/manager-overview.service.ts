import { Types } from "mongoose";
import { ManagerOverview } from "@read-models/managers/manager-overview.model";
import { Vehicle } from "@modules/vehicles/vehicle.model";
import { User } from "@modules/users/user.model";

type BreakdownItem = { type: "fuel" | "electric" | "tolls"; total: number };
type RankItem = { userId: Types.ObjectId; total: number };

type ManagerRMLean = {
  yearMonth: string;
  totals: { fuel: number; tolls: number; electric: number; grandTotal: number };
  breakdownByType?: BreakdownItem[];
  rankingUsers?: RankItem[];
  updatedAt: Date;
};

type FleetVehicleDTO = {
  vehicleId: string;
  plate: string;
  vehicleModel: string;
  odometerKm: number;
  active: boolean;
  driver: {
    userId: string;
    username: string;
    displayName?: string | null;
    email?: string;
  } | null;
};

function ym(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseMonthRef(m?: string): Date {
  if (!m) return new Date();
  const [y, mm] = m.split("-").map(Number);
  if (!y || !mm || mm < 1 || mm > 12) return new Date();
  return new Date(y, mm - 1, 1);
}

function ytdKeysFrom(monthRef: Date): string[] {
  const y = monthRef.getFullYear();
  const upto = monthRef.getMonth();
  const keys: string[] = [];
  for (let i = 0; i <= upto; i++) {
    const mm = String(i + 1).padStart(2, "0");
    keys.push(`${y}-${mm}`);
  }
  return keys;
}

export async function getManagerOverviewRM(args: {
  companyId: string;
  month?: string;
  top?: number;
}) {
  const { companyId, month, top = 10 } = args;
  const company = new Types.ObjectId(companyId);

  const ref = parseMonthRef(month);
  const monthKey = ym(ref);
  const ytdKeys = ytdKeysFrom(ref);

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

  const totalsYtd = ytdAgg[0]
    ? {
        fuel: ytdAgg[0].fuel ?? 0,
        electric: ytdAgg[0].electric ?? 0,
        tolls: ytdAgg[0].tolls ?? 0,
        grandTotal: ytdAgg[0].grandTotal ?? 0,
      }
    : { fuel: 0, electric: 0, tolls: 0, grandTotal: 0 };

  const vehicles = await Vehicle.find({ companyId: company })
    .select({
      plate: 1,
      vehicleModel: 1,
      odometerKm: 1,
      active: 1,
      driverId: 1,
    })
    .lean()
    .exec();

  const driverIds = Array.from(
    new Set(
      vehicles
        .map((v) => v.driverId)
        .filter((id): id is Types.ObjectId => !!id)
        .map((id) => String(id))
    )
  ).map((id) => new Types.ObjectId(id));

  let usersById = new Map<
    string,
    { username: string; displayName?: string | null; email?: string }
  >();
  if (driverIds.length) {
    const users = await User.find({ _id: { $in: driverIds } })
      .select({ username: 1, displayName: 1, email: 1 })
      .lean()
      .exec();
    usersById = new Map(
      users.map((u) => [
        String(u._id),
        {
          username: u.username,
          displayName: u.displayName ?? null,
          email: u.email,
        },
      ])
    );
  }

  const fleet: FleetVehicleDTO[] = vehicles.map((v) => {
    const drv = v.driverId ? usersById.get(String(v.driverId)) : undefined;
    return {
      vehicleId: String(v._id),
      plate: v.plate,
      vehicleModel: v.vehicleModel,
      odometerKm: typeof v.odometerKm === "number" ? v.odometerKm : 0,
      active: !!v.active,
      driver:
        v.driverId && drv
          ? {
              userId: String(v.driverId),
              username: drv.username,
              displayName: drv.displayName ?? undefined,
              email: drv.email,
            }
          : null,
    };
  });

  return {
    month: monthKey,
    totalsMonth: thisMonth?.totals ?? {
      fuel: 0,
      electric: 0,
      tolls: 0,
      grandTotal: 0,
    },
    totalsYtd,
    breakdownByTypeMonth: thisMonth?.breakdownByType ?? [],
    rankingUsersMonth: (thisMonth?.rankingUsers ?? [])
      .slice(0, top)
      .map((r) => ({ userId: r.userId.toString(), total: r.total })),
    fleet,
  };
}
