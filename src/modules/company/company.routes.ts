import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";
import * as ctrl from "@modules/company/company.controller";

const r = Router();

r.post("/", requireAuth, requireRole("admin"), ctrl.createCompany);
r.get("/:companyId", requireAuth, ctrl.getCompany);

export default r;
