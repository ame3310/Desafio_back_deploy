import { User } from "@modules/users/user.model";
import { toPublicUser } from "@modules/users/user.mapper";
import { ERR } from "@shared/constants/error.constants";
import { ApiError } from "@shared/errors/apiError";
import type { PublicUser } from "@modules/users/user.types";

export async function getById(id: string): Promise<PublicUser> {
  const user = await User.findById(id);
  if (!user)
    throw ApiError.notFound("Usuario no encontrado", ERR.USER.NOT_FOUND);
  return toPublicUser(user);
}

export async function assertManagerCanActOnUser(
  managerCompanyId: string,
  targetUserId: string
): Promise<void> {
  const target = await User.findById(targetUserId).select("companyId").lean();
  if (!target || target.companyId !== managerCompanyId) {
    throw ApiError.forbidden("No permitido", ERR.COMMON.FORBIDDEN);
  }
}

export async function listEmployeesOfCompany(companyId: string) {
  return User.find({ companyId })
    .select("_id email username role companyId")
    .lean();
}

export async function updateMe(
  id: string,
  data: Partial<{ avatarUrl: string; bio: string }>
): Promise<PublicUser> {
  const updated = await User.findByIdAndUpdate(id, data, { new: true });
  if (!updated)
    throw ApiError.notFound("Usuario no encontrado", ERR.USER.NOT_FOUND);
  return toPublicUser(updated);
}

export async function deleteMe(id: string): Promise<void> {
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted)
    throw ApiError.notFound("Usuario no encontrado", ERR.USER.NOT_FOUND);
}
