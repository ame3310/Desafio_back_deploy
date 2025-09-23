import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express, { type Application } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app: Application = express();
app.set("trust proxy", 1);
app.use(helmet());

const allowlist = new Set<string>(
  [
    "http://localhost:5173",
    process.env.CORS_ORIGIN, //en esa variable irá la url que nos de, por ejemplo, Vercel
  ].filter(Boolean) as string[]
);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowlist.has(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//Para limitar peticiones (por ejemplo, máximo 100 por una misma ip)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});

app.use("/auth", authLimiter); //hay que poner el limitador para que funcione

app.get("/ready", (_req, res) => res.status(200).json({ ready: true })); //Healthcheck (curl -i http://localhost:3000/)

export default app;
