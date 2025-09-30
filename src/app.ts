import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors, { type CorsOptions } from "cors";
import authRoutes from "@modules/auth/auth.routes";
import userRoutes from "@modules/users/user.routes";
import companyRoutes from "@modules/company/company.routes";
import userOverviewRoutes from "@modules/reports/routes/user.overview.routes";
import managerOverviewRoutes from "@modules/reports/routes/manager.overview.routes";
import {
  managerInvitationAdminRouter,
  managerInvitationPublicRouter,
} from "@modules/invitations/invitation.routes";

import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";
import ticketRoutes from "@modules/tickets/ticket.routes";

const app: Application = express();

app.set("trust proxy", 1);
app.use(helmet());

const allowlist = new Set<string>(
  ["http://localhost:5173", process.env.CORS_ORIGIN].filter(Boolean) as string[]
);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowlist.has(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});

app.use("/auth", authLimiter);

app.get("/ready", (_req, res) => res.status(200).json({ ready: true }));
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.use("/auth", authRoutes);

app.use("/users", requireAuth, userRoutes);

app.use("/companies", requireAuth, companyRoutes);

app.use("/tickets", requireAuth, ticketRoutes);

app.use("/reports/me", requireAuth, userOverviewRoutes);

app.use(
  "/reports/manager",
  requireAuth,
  requireRole("manager"),
  managerOverviewRoutes
);

app.use(
  "/admin",
  requireAuth,
  requireRole("admin"),
  managerInvitationAdminRouter
);

app.use(managerInvitationPublicRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

export default app;
