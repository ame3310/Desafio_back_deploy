import { Router } from "express";
import { getManagerOverviewCtrl } from "@modules/overviews/overview.controller";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";

const r = Router();
r.get("/manager", requireAuth, requireRole("manager"), getManagerOverviewCtrl);
export default r;
