import { Types } from "mongoose";
import { UserOverview } from "@read-models/users/user-overview.model";
import { Vehicle } from "@modules/vehicles/vehicle.model";

type UserRMLean = {
  yearMonth: string;
  totals: { fuel: number; tolls: number; electric: number; grandTotal: number };
  counts: { tickets: number };
  updatedAt: Date;
};

type VehicleLean = {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  driverId?: Types.ObjectId | null;
  plate: string;
  vehicleModel: string;
  odometerKm: number;
  active?: boolean;
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


async function getUserVehicle(companyId: Types.ObjectId, userId: Types.ObjectId) {
  const v = await Vehicle.findOne({
    companyId,
    driverId: userId,
    active: true,
  })
    .select<Pick<VehicleLean, "_id" | "plate" | "vehicleModel" | "odometerKm">>({
      plate: 1,
      vehicleModel: 1,
      odometerKm: 1,
    })
    .lean<VehicleLean>()
    .exec()
    .catch(() => null);

  if (!v) return null;

  return {
    vehicleId: String(v._id),
    plate: v.plate,
    vehicleModel: v.vehicleModel,
    odometerKm: v.odometerKm,
  };
}


export async function getUserOverviewRM(args: {
  companyId: string | null;
  userId: string;
  month?: string;
}) {
  const { companyId, userId, month } = args;

  const ref = parseMonthRef(month);
  const monthKey = ym(ref);

  if (!companyId) {
    return {
      month: monthKey,
      totalsMonth: { fuel: 0, electric: 0, tolls: 0, grandTotal: 0 },
      totalsYtd: { fuel: 0, electric: 0, tolls: 0, grandTotal: 0 },
      ticketsMonth: 0,
      ticketsYtd: 0,
      vehicle: null,
    };
  }

  const company = new Types.ObjectId(companyId);
  const user = new Types.ObjectId(userId);
  const ytdKeys = ytdKeysFrom(ref);

  const thisMonth = await UserOverview.findOne({
    companyId: company,
    userId: user,
    yearMonth: monthKey,
  })
    .select({ yearMonth: 1, totals: 1, counts: 1, updatedAt: 1 })
    .lean<UserRMLean | null>();

  const ytdAgg = await UserOverview.aggregate([
    { $match: { companyId: company, userId: user, yearMonth: { $in: ytdKeys } } },
    {
      $group: {
        _id: null,
        fuel: { $sum: "$totals.fuel" },
        electric: { $sum: "$totals.electric" },
        tolls: { $sum: "$totals.tolls" },
        grandTotal: { $sum: "$totals.grandTotal" },
        tickets: { $sum: "$counts.tickets" },
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

  const ticketsYtd = ytdAgg[0]?.tickets ?? 0;

  const vehicle = await getUserVehicle(company, user);

  return {
    month: monthKey,
    totalsMonth:
      thisMonth?.totals ?? { fuel: 0, electric: 0, tolls: 0, grandTotal: 0 },
    totalsYtd,
    ticketsMonth: thisMonth?.counts?.tickets ?? 0,
    ticketsYtd,
    vehicle,
  };
}
