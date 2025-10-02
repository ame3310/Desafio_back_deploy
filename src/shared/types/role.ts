export const ROLES = ["user", "manager", "admin"] as const;
export type Role = (typeof ROLES)[number];

