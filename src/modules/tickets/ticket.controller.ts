import type { Request, Response, NextFunction } from "express";
import * as svc from "@modules/tickets/ticket.service";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";

export async function createFromGasolineras(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);

    const file = req.file;
    if (!file)
      return res.status(400).json({ message: "Falta el archivo 'file'." });

    const fecha =
      typeof req.body?.fecha === "string"
        ? new Date(req.body.fecha)
        : new Date();

    const result = await svc.createFromGasolineras({
      file,
      fecha,
      user: { id: req.user.id, companyId: req.user.companyId ?? null },
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function createFromPeaje(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);

    const file = req.file;
    if (!file)
      return res.status(400).json({ message: "Falta el archivo 'file'." });

    const fecha =
      typeof req.body?.fecha === "string"
        ? new Date(req.body.fecha)
        : new Date();

    const result = await svc.createFromPeaje({
      file,
      fecha,
      user: { id: req.user.id, companyId: req.user.companyId ?? null },
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}
