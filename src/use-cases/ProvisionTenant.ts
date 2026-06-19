import { ensureCredentialUser } from "../lib/credential-user.js";
import { prisma } from "../lib/db.js";
import { buildTenantIdentity, ensureTenant } from "../lib/tenant.js";
import { ConflictError } from "./errors.js";

interface InputDto {
  tenantName: string;
  tenantId?: string;
  tenantSlug?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface ProvisionTenantOutputDto {
  tenant: {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  admin: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN";
    createdAt: string;
    updatedAt: string;
  };
}

export class ProvisionTenant {
  async execute(dto: InputDto): Promise<ProvisionTenantOutputDto> {
    const normalizedEmail = dto.adminEmail.trim().toLowerCase();
    const identity = buildTenantIdentity({
      tenantId: dto.tenantId,
      tenantSlug: dto.tenantSlug,
      name: dto.tenantName,
    });

    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Admin e-mail already exists");
    }

    return prisma.$transaction(async (tx) => {
      const tenant = await ensureTenant({
        tenantId: identity.tenantId,
        tenantSlug: identity.tenantSlug,
        name: identity.tenantName,
        isActive: true,
        db: tx,
      });

      const admin = await ensureCredentialUser({
        name: dto.adminName,
        email: normalizedEmail,
        password: dto.adminPassword,
        role: "ADMIN",
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        db: tx,
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: admin.id,
          action: "TENANT_PROVISIONED",
          entity: "Tenant",
          entityId: tenant.id,
          metadata: {
            slug: tenant.slug,
            adminEmail: admin.email,
          },
        },
      });

      return {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        },
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: "ADMIN",
          createdAt: admin.createdAt.toISOString(),
          updatedAt: admin.updatedAt.toISOString(),
        },
      };
    });
  }
}
