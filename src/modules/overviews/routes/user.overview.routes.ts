import { Router } from "express";
import { getSelfUserOverviewCtrl, getWorkerOverviewCtrl } from "@modules/overviews/overview.controller";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";

const r = Router();
r.get("/user", requireAuth, getSelfUserOverviewCtrl);
r.get("/user/:userId", requireAuth, requireRole("manager"), getWorkerOverviewCtrl);

export default r;
