import { RequestHandler } from "express";
import { extractUserFromAuthHeader } from "@utils/auth";
import { ApiError } from "@shared/errors/apiError";

export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    const user = extractUserFromAuthHeader(req);
    if (!user) throw ApiError.unauthorized();
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
