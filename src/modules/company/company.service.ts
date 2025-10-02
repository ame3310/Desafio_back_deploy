import { Company } from "./company.model";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";
import type { CreateCompanyDTO } from "./company.validations";
import { ManagerInvitationModel } from "@modules/invitations/invitation.model";
import { randomBytes, createHash } from "crypto";

export async function createCompany(input: CreateCompanyDTO) {
  const exists = await Company.findOne({ cif: input.cif.trim().toUpperCase() }).lean();
  if (exists) throw ApiError.badRequest("CIF ya registrado", ERR.COMPANY.CIF_IN_USE);

  const company = await Company.create({
    name: input.name.trim(),
    cif: input.cif.trim().toUpperCase(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    status: "pending",
    plan: input.plan ?? "starter",
  });

  const token = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await ManagerInvitationModel.create({
    companyId: company._id,
    tokenHash,
    used: false,
  });

  const base = process.env.APP_BASE_URL ?? "http://localhost:5173";
  const invitationUrl = `${base}/register-manager?token=${token}`;

  return { company, invitationUrl };
}

export async function getCompanyById(companyId: string) {
  return Company.findById(companyId)
    .select("_id name cif contactEmail status plan managerIds createdAt updatedAt")
    .lean();
}
