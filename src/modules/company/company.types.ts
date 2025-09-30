export type CompanyProps = {
  name: string;
  cif: string;
  contactEmail: string;
  externalId?: string | null; // por lo del "EMP001" (borrar tras llegar a acuerdo)
  status: "pending" | "active" | "suspended"; // No necesario
  plan?: "starter" | "pro" | "enterprise"; // No necesario
  managerIds: string[];
};