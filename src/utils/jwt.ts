import { env } from "@config/env";
import { ERR } from "@shared/constants/error.constants";
import { ApiError } from "@shared/errors/apiError";
import jwt, {
  type SignOptions,
  type JwtPayload as StdJwtPayload,
} from "jsonwebtoken";
import ms, { type StringValue as MsStringValue } from "ms";
import type {
  AccessJwtPayload,
  RefreshJwtPayload,
} from "@modules/auth/auth.types";

type VerifyOpts = {
  clockTolerance?: number;
  audience?: string;
  issuer?: string;
};

function parseExpiresToSeconds(value: string | number): number {
  if (typeof value === "number") return value;
  if (/^\d+$/.test(value)) return Number(value);
  const millis = ms(value as MsStringValue);
  if (typeof millis !== "number") {
    throw ApiError.badRequest(`Invalid EXPIRES_IN value: '${value}'`, ERR.COMMON.INVALID_PAYLOAD);
  }
  return Math.floor(millis / 1000);
}

const sign = (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string
): string => {
  const opts: SignOptions = {
    algorithm: "HS256",
    expiresIn: parseExpiresToSeconds(expiresIn),
  };
  return jwt.sign(payload, secret, opts);
};

function isAccessJwtPayload(x: unknown): x is AccessJwtPayload {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as any).id === "string" &&
    typeof (x as any).role === "string"
  );
}

function isRefreshJwtPayload(x: unknown): x is RefreshJwtPayload {
  return !!x && typeof x === "object" && typeof (x as any).id === "string";
}

export const generateAccessToken = (payload: AccessJwtPayload): string =>
  sign(payload, env.ACCESS_TOKEN_SECRET, env.ACCESS_TOKEN_EXPIRES_IN);

export const generateRefreshToken = (payload: RefreshJwtPayload): string =>
  sign(payload, env.REFRESH_TOKEN_SECRET, env.REFRESH_TOKEN_EXPIRES_IN);

export function verifyAccessToken(
  token: string,
  opts?: VerifyOpts
): AccessJwtPayload {
  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
      clockTolerance: opts?.clockTolerance ?? 0,
      audience: opts?.audience,
      issuer: opts?.issuer,
    });

    if (typeof decoded === "string" || !isAccessJwtPayload(decoded)) {
      throw ApiError.unauthorized("Token inválido", ERR.AUTH.INVALID_TOKEN);
    }
    return decoded;
  } catch (e: any) {
    const name = String(e?.name ?? "").toLowerCase();
    const msg = String(e?.message ?? "").toLowerCase();
    if (name.includes("tokenexpirederror") || msg.includes("expired")) {
      throw ApiError.unauthorized(
        "Access token expirado",
        ERR.AUTH.ACCESS_TOKEN_EXPIRED,
        undefined,
        {
          "WWW-Authenticate":
            'Bearer error="invalid_token", error_description="access token expired"',
        }
      );
    }
    throw ApiError.unauthorized("Token inválido", ERR.AUTH.INVALID_TOKEN);
  }
}

export function verifyRefreshToken(token: string): RefreshJwtPayload {
  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    if (typeof decoded === "string" || !isRefreshJwtPayload(decoded)) {
      throw ApiError.forbidden(
        "Refresh token inválido",
        ERR.AUTH.REFRESH_TOKEN_INVALID
      );
    }
    return decoded;
  } catch {
    throw ApiError.forbidden(
      "Refresh token inválido",
      ERR.AUTH.REFRESH_TOKEN_INVALID
    );
  }
}

/* Para usar en debug/tests */
export function decodeTokenStd(token: string): StdJwtPayload | null {
  const d = jwt.decode(token);
  return d && typeof d !== "string" ? d : null;
}
