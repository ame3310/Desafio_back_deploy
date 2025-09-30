import { Role } from "@shared/types/role";
import type { HydratedDocument, Model } from "mongoose";

export type UserProps = {
  email: string;
  password: string;
  role: Role;
  companyId?: string | null;
  username: string;
  usernameLower: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  displayName?: string;
  refreshTokenHash?: string | null;
};

export interface IUserMethods {
  comparePassword(plain: string): Promise<boolean>;
}

export interface IUserModel extends Model<UserProps, {}, IUserMethods> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findByUsername(username: string): Promise<UserDocument | null>;
  findByEmailForAuth(email: string): Promise<UserDocument | null>;
}

export type UserDocument = HydratedDocument<UserProps, IUserMethods>;

export type PublicUser = {
  id: string;
  email: string;
  role: Role;
  companyId?: string | null;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

export type PublicAuthorBrief = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

export type PublicUserForSearch = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};
