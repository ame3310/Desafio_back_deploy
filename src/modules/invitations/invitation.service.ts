import { randomBytes, createHash } from "crypto";
import { ManagerInvitationModel } from "@modules/invitations/invitation.model";
import { Company } from "@modules/company/company.model";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";

export async function createManagerInvitation( 
  input: { companyId: string }
) {
  const company = await Company.findById(input.companyId).select("name").lean();
  if (!company) throw ApiError.notFound("Empresa no existe");

  const raw = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(raw).digest("hex");

  await ManagerInvitationModel.create({
    tokenHash,
    companyId: input.companyId,
    used: false,
  });

  return { invitationToken: raw, companyName: company.name };
}

export async function inspectManagerInvitation(tokenRaw: string) {
  const tokenHash = createHash("sha256").update(tokenRaw).digest("hex");

  const inv = await ManagerInvitationModel.findOne({ tokenHash, used: false })
    .select("companyId")
    .lean();

  if (!inv)
    throw ApiError.notFound(
      "Invitación no válida",
      ERR.INVITATION.INVALID_INVITATION
    );

  const company = await Company.findById(inv.companyId).select("name").lean();
  if (!company)
    throw ApiError.notFound("Empresa no existe", ERR.COMPANY.NOT_FOUND);

  return { companyId: inv.companyId, companyName: company.name };
}
