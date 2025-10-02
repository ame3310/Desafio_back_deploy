import type { RequestHandler } from "express";
import { ApiError } from "@shared/errors/apiError";
import type { Role } from "@shared/types/role";

const ROLE_LEVEL: Readonly<Record<Role, number>> = Object.freeze({
  user: 1,
  manager: 2,
  admin: 3,
});

export const requireRole =
  (minRole: Role): RequestHandler =>
  (req, _res, next) => {
    const u = req.user;
    if (!u) return next(ApiError.unauthorized());

    if (ROLE_LEVEL[u.role] < ROLE_LEVEL[minRole]) {
      return next(ApiError.forbidden("No permitido"));
    }

    next();
  };
