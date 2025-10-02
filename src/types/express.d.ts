import type { RequestUser } from "@shared/types/request-user";
import type { RequestScope } from "@shared/types/request-scope";

declare module "express-serve-static-core" {
  interface Request {
    user?: RequestUser | null;
  }
}
export {};
