import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, refresh, logout } from "./auth.controller";
import { requireAuth } from "@middlewares/requireAuth.middleware";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Demasiadas peticiones, intenta más tarde" },
});

router.use(authLimiter);

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refresh);
router.post("/logout", requireAuth, logout);

export default router;
