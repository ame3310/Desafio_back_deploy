import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";
import * as ctrl from "@modules/invitations/invitation.controller";

export const managerInvitationAdminRouter = Router();
managerInvitationAdminRouter.use(requireAuth, requireRole("admin"));
managerInvitationAdminRouter.post(
  "/companies/:companyId/invitations",
  ctrl.createInvitation
);

export const managerInvitationPublicRouter = Router();
managerInvitationPublicRouter.get(
  "/managers/invitations/inspect",
  ctrl.inspectInvitation
);
