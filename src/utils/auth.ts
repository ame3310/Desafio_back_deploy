import { RequestUser } from "@shared/types/request-user";
import { ERR } from "@shared/constants/error.constants";
import { ApiError } from "@shared/errors/apiError";
import { verifyAccessToken } from "@utils/jwt";
import type { Request } from "express";

export function extractUserFromAuthHeader(req: Request): RequestUser {
  const auth = req.get("authorization");
  if (!auth) {
    throw ApiError.unauthorized(
      "Token no proporcionado",
      ERR.AUTH.NO_TOKEN_PROVIDED
    );
  }
  const [scheme, token] = auth.split(" ");
  if ((scheme || "").toLowerCase() !== "bearer" || !token) {
    throw ApiError.unauthorized(
      "Formato de Authorization inválido",
      ERR.AUTH.INVALID_TOKEN
    );
  }

  const payload = verifyAccessToken(token.trim(), { clockTolerance: 5 });
  if (!payload.id || !payload.role) {
    throw ApiError.unauthorized("Token inválido", ERR.AUTH.INVALID_TOKEN);
  }

  return { id: payload.id, role: payload.role };
}
