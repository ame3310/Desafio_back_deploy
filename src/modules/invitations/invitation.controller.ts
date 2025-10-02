import { ApiError } from "@shared/errors/apiError";
import { RequestHandler } from "express";
import {
  createManagerInvitation,
  inspectManagerInvitation,
} from "@modules/invitations/invitation.service";
import { ERR } from "@shared/constants/error.constants";

export const createInvitation: RequestHandler = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const out = await createManagerInvitation({ companyId });
    res.status(201).json({ ...out, companyId });
  } catch (e) {
    next(e);
  }
};

export const inspectInvitation: RequestHandler = async (req, res, next) => {
  try {
    const token = String(req.query.token || "");
    if (!token)
      throw ApiError.badRequest("token requerido", ERR.AUTH.INVALID_TOKEN);
    const info = await inspectManagerInvitation(token);
    res.json(info);
  } catch (e) {
    next(e);
  }
};
