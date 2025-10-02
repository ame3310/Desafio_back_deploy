import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import * as userController from "@modules/users/user.controller";

const router = Router();

router.get("/me", requireAuth, userController.getMe);
router.patch("/me", requireAuth, userController.patchMe);
router.delete("/me", requireAuth, userController.deleteMe);

export default router;
