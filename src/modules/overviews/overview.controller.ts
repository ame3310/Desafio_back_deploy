import { Request, Response, NextFunction } from "express";
import { getManagerOverviewRM } from "@read-models/managers/manager-overview.service";
import { getUserOverviewRM } from "@read-models/users/user-overview.service";

export async function getManagerOverviewCtrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId)
      return res.status(400).json({ error: "MANAGER_WITHOUT_COMPANY" });

    const month =
      typeof req.query.month === "string" ? req.query.month : undefined;
    const top =
      typeof req.query.top === "string" && req.query.top.trim() !== ""
        ? Number(req.query.top)
        : undefined;

    const data = await getManagerOverviewRM({
      companyId: String(companyId),
      month,
      top,
    });

    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function getSelfUserOverviewCtrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const companyId = req.user?.companyId ?? null; 
    const userId = req.user!.id;

    const month =
      typeof req.query.month === "string" ? req.query.month : undefined;

    const data = await getUserOverviewRM({
      companyId: companyId ? String(companyId) : null,
      userId: String(userId),
      month,
    });

    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function getWorkerOverviewCtrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId)
      return res.status(400).json({ error: "MANAGER_WITHOUT_COMPANY" });

    const userId = String(req.params.userId);

    const month =
      typeof req.query.month === "string" ? req.query.month : undefined;

    const data = await getUserOverviewRM({
      companyId: String(companyId),
      userId,
      month,
    });

    res.json(data);
  } catch (e) {
    next(e);
  }
}
