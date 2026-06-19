import { prisma } from "../lib/db.js";
import { ProvisionTenant } from "../use-cases/ProvisionTenant.js";

const provisionTenant = new ProvisionTenant();

const result = await provisionTenant.execute({
  tenantName: process.env.TENANT_NAME ?? "Nova Loja",
  tenantId: process.env.TENANT_ID,
  tenantSlug: process.env.TENANT_SLUG,
  adminName: process.env.ADMIN_NAME ?? "Administrador",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@pdv.local",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
});

await prisma.$disconnect();

console.log(`Tenant provisionado: ${result.tenant.name}`);
console.log(`ID: ${result.tenant.id}`);
console.log(`Slug: ${result.tenant.slug}`);
console.log(`Admin: ${result.admin.email}`);
