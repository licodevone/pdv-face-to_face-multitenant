import { prisma } from "../lib/db.js";
import { ensureCredentialUser } from "../lib/credential-user.js";

const adminName = process.env.ADMIN_NAME ?? "Administrador";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@pdv.local";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const tenantId = process.env.TENANT_ID ?? "default";
const tenantSlug = process.env.TENANT_SLUG;
const tenantName = process.env.TENANT_NAME;

await ensureCredentialUser({
  name: adminName,
  email: adminEmail,
  password: adminPassword,
  role: "ADMIN",
  tenantId,
  tenantSlug,
  tenantName,
});

await prisma.$disconnect();

console.log(`Admin pronto: ${adminEmail}`);
console.log(`Senha: ${adminPassword}`);
console.log(`Tenant: ${tenantId}${tenantSlug ? ` (${tenantSlug})` : ""}`);
