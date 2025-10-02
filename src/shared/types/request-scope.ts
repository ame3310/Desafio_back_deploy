export type RequestScope = {
  requestId: string;
  userId?: string;
  role?: "user" | "manager" | "admin";
  companyId?: string;
  empresaNombre?: string; 
  timeZone?: string;
};
