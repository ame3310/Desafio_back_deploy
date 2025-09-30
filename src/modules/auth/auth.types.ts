import { Role } from "@shared/types/role";

export type AccessJwtPayload = {
  id: string;
  role: Role;
  email?: string;
  iat?: number;
  exp?: number;
};

export type RefreshJwtPayload = {
  id: string;
  iat?: number;
  exp?: number;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};
