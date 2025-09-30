import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";
import { getUserFuelYtdAndSeriesFromData } from "@modules/reports/services/userFuelFromData.service";

const r = Router();

r.get("/reports/me/fuel", requireAuth, async (req, res, next) => {
  try {
    const u = req.user;
    if (!u)
      throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);

    const year = Number(req.query.year ?? new Date().getFullYear());
    if (!Number.isFinite(year)) {
      throw ApiError.badRequest("year inválido", ERR.COMMON.BAD_REQUEST);
    }

    const data = await getUserFuelYtdAndSeriesFromData({
      userId: u.id,
      companyId: u.companyId ?? null,
      year,
    });

    res.json({ year, ...data });
  } catch (e) {
    next(e);
  }
});

export default r;
