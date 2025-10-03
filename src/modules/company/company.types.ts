export type CompanyProps = {
  name: string;
  cif: string;
  contactEmail: string;
  externalId?: string | null; 
  status: "pending" | "active" | "suspended"; 
  plan?: "starter" | "pro" | "enterprise"; 
  managerIds: string[];
};