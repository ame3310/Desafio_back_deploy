import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";
import { Company } from "@modules/company/company.model";
import {
  llamadaParaPieChartGastosTotalesEmpresaPorTipo,
  llamadaParaGastoTotalPorUsuarioDeMismaEmpresa,
} from "@modules/reports/services/manager.overview.service";

const r = Router();

/**
 * GET /reports/manager/overview?ym=YYYY-MM
 * Devuelve:
 *   { empresa: {id, name}, periodo: {ym, start_date}, pie, ranking }
 */
r.get(
  "/overview",
  requireAuth,
  requireRole("manager"),
  async (req, res, next) => {
    try {
      const u = req.user!;
      if (!u.companyId) {
        throw ApiError.forbidden(
          "No tiene empresa asignada",
          ERR.COMMON.FORBIDDEN
        );
      }

      const ymQ = typeof req.query.ym === "string" ? req.query.ym : undefined;
      let year: number;
      let month: number;
      if (ymQ) {
        const m = /^(\d{4})-(\d{2})$/.exec(ymQ);
        if (!m)
          throw ApiError.badRequest(
            "Parámetro ym inválido (YYYY-MM)",
            ERR.COMMON.BAD_REQUEST
          );
        year = Number(m[1]);
        month = Number(m[2]);
      } else {
        year = Number(req.query.year ?? new Date().getFullYear());
        month = Number(req.query.month ?? new Date().getMonth() + 1);
        if (
          !Number.isFinite(year) ||
          !Number.isFinite(month) ||
          month < 1 ||
          month > 12
        ) {
          throw ApiError.badRequest(
            "Parámetros year/month inválidos",
            ERR.COMMON.BAD_REQUEST
          );
        }
      }
      const ym = `${year}-${String(month).padStart(2, "0")}`;
      const start_date = `${ym}-01`;

      // nombre visible para la API externa
      const company = await Company.findById(u.companyId).select("name").lean();
      if (!company)
        throw ApiError.notFound("Empresa no encontrada", ERR.COMPANY.NOT_FOUND);

      // llamadas a servicios
      const [pie, ranking] = await Promise.all([
        llamadaParaPieChartGastosTotalesEmpresaPorTipo({
          empresaNombre: company.name,
          start_date,
          end_date: "",
        }),
        llamadaParaGastoTotalPorUsuarioDeMismaEmpresa({
          empresaNombre: company.name,
          start_date,
          end_date: "",
        }),
      ]);

      res.json({
        empresa: { id: u.companyId, name: company.name },
        periodo: { ym, start_date },
        pie,
        ranking,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default r;
