import { updateMeSchema } from "@modules/users/user.validations";
import * as userService from "@modules/users/user.service";
import { ERR } from "@shared/constants/error.constants";
import { ApiError } from "@shared/errors/apiError";
import { NextFunction, Request, Response } from "express";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId)
      throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);
    const user = await userService.getById(userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function patchMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId)
      throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);

    const parsed = updateMeSchema.parse(req.body);
    const updated = await userService.updateMe(userId, parsed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId)
      throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);
    await userService.deleteMe(userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
