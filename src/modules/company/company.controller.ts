import type { RequestHandler } from "express";
import { ApiError } from "@shared/errors/apiError";
import { ERR } from "@shared/constants/error.constants";
import { createCompanySchema } from "@modules/company/company.validations";
import * as companyService from "@modules/company/company.service";

export const createCompany: RequestHandler = async (req, res, next) => {
  try {
    const dto = createCompanySchema.parse(req.body);

    const { company, invitationUrl } = await companyService.createCompany(dto);
    res.status(201).json({
      company: {
        _id: company._id.toString(), 
        name: company.name,
        cif: company.cif,
        contactEmail: company.contactEmail,
        status: company.status,
        plan: company.plan,
      },
      managerInvitationUrl: invitationUrl,
    });
  } catch (e) {
    next(e);
  }
};

export const getCompany: RequestHandler = async (req, res, next) => {
  try {
    const c = await companyService.getCompanyById(req.params.companyId);
    if (!c)
      throw ApiError.notFound("Empresa no encontrada", ERR.COMPANY.NOT_FOUND);
    res.json(c);
  } catch (e) {
    next(e);
  }
};
