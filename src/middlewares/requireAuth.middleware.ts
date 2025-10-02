import type { RequestHandler } from "express";
import { authenticateRequest } from "@modules/auth/auth.service";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    req.user = await authenticateRequest(req);
    next();
  } catch (err) {
    next(err);
  }
};
