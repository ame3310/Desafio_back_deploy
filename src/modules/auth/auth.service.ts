import { createHash } from "crypto";
import type { Request } from "express";

import { User } from "@modules/users/user.model";
import { toPublicUser } from "@modules/users/user.mapper";
import { Company } from "@modules/company/company.model";
import { ManagerInvitationModel } from "@modules/invitations/invitation.model";

import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "@utils/jwt";

import type { Role } from "@shared/types/role";
import type {
  AccessJwtPayload,
  RefreshJwtPayload,
} from "@modules/auth/auth.types";
import type { PublicUser, UserDocument } from "@modules/users/user.types";

type Tokens = { accessToken: string; refreshToken: string };
type Meta = { userAgent?: string; ip?: string };
type AuthResult = { user: PublicUser } & Tokens;

export type AuthenticatedUser = {
  id: string;
  role: "user" | "manager" | "admin";
  companyId?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function issueTokens(user: UserDocument): Promise<Tokens> {
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  } satisfies AccessJwtPayload);

  const refreshToken = generateRefreshToken({
    id: user.id,
  } satisfies RefreshJwtPayload);

  return { accessToken, refreshToken };
}

async function findByEmailForAuth(email: string): Promise<UserDocument | null> {
  const doc = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );
  return doc as unknown as UserDocument | null;
}

export async function authenticateRequest(
  req: Request
): Promise<AuthenticatedUser> {
  const auth = req.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);

  const payload = verifyAccessToken(m[1]);
  const db = await User.findById(payload.id).select("role companyId").lean();
  if (!db)
    throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);

  return {
    id: payload.id,
    role: db.role,
    companyId: db.companyId ?? undefined,
  };
}

type RegisterOpts = { companyId?: string; invitationToken?: string };

export async function register(
  email: string,
  password: string,
  username: string,
  _meta?: Meta,
  opts?: RegisterOpts
): Promise<AuthResult> {
  const normalizedEmail = normalizeEmail(email);

  const [emailTaken, usernameTaken] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    User.findOne({ usernameLower: username.trim().toLowerCase() }),
  ]);
  if (emailTaken)
    throw ApiError.badRequest("Email ya registrado", ERR.USER.EMAIL_IN_USE);
  if (usernameTaken)
    throw ApiError.badRequest(
      "Username no disponible",
      ERR.USER.USERNAME_TAKEN
    );

  let role: Role = "user";
  let companyId: string | null = null;

  if (opts?.invitationToken) {
    const tokenHash = createHash("sha256")
      .update(opts.invitationToken)
      .digest("hex");
    const inv = await ManagerInvitationModel.findOneAndUpdate(
      { tokenHash, used: false },
      { $set: { used: true } },
      { new: false }
    )
      .select("companyId")
      .lean();

    if (!inv)
      throw ApiError.forbidden(
        "Invitación no válida",
        ERR.AUTH.INVALID_INVITATION
      );

    const company = await Company.findById(inv.companyId).select("_id").lean();
    if (!company)
      throw ApiError.forbidden("Empresa no existe", ERR.COMPANY.NOT_FOUND);

    role = "manager";
    companyId = inv.companyId;
  }
  else if (opts?.companyId) {
    const company = await Company.findById(opts.companyId).select("_id").lean();
    if (!company)
      throw ApiError.badRequest("Empresa no existe", ERR.COMPANY.NOT_FOUND);
    companyId = opts.companyId;
  }

  const user = await User.create({
    email: normalizedEmail,
    password,
    username,
    usernameLower: username.toLowerCase(),
    role,
    companyId, 
  });

  // mantener relación manager<->company
  if (role === "manager" && companyId) {
    await Company.findByIdAndUpdate(companyId, {
      $addToSet: { managerIds: user.id },
    });
  }

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(
  email: string,
  password: string,
  _meta?: Meta
): Promise<AuthResult> {
  const normalized = normalizeEmail(email);

  const user = await findByEmailForAuth(normalized);
  if (!user)
    throw ApiError.unauthorized(
      "Credenciales inválidas",
      ERR.AUTH.INVALID_CREDENTIALS
    );

  const ok = await user.comparePassword(password);
  if (!ok)
    throw ApiError.unauthorized(
      "Credenciales inválidas",
      ERR.AUTH.INVALID_CREDENTIALS
    );

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(
  refreshToken?: string,
  _meta?: Meta
): Promise<AuthResult> {
  if (!refreshToken)
    throw ApiError.unauthorized(
      "Refresh ausente",
      ERR.AUTH.REFRESH_TOKEN_INVALID
    );

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.id);
  if (!user)
    throw ApiError.unauthorized("No autorizado", ERR.COMMON.UNAUTHORIZED);

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function logout(
  _userId: string,
  _refreshToken?: string
): Promise<void> {
  // revocación de sesiones si la implementas en el futuro
  return;
}
