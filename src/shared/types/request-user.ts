import type { AccessJwtPayload } from "@modules/auth/auth.types";

export type RequestUser = Pick<AccessJwtPayload, "id" | "role">;
