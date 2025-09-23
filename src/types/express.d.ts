import type { RequestUser } from "@types/request-user";

declare module "express-serve-static-core" {
  interface Request {
    user?: RequestUser | null;
  }
}
export {};
