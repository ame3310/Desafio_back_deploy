export type RequestUser = {
  id: string;
  role: "user" | "manager" | "admin";
  companyId?: string;
};
