import { prisma } from "../lib/db.js";
import {
  buildTenantIdentity,
  DEFAULT_TENANT_ID,
  DEFAULT_TENANT_SLUG,
  normalizeTenantSlug,
} from "../lib/tenant.js";
import { ConflictError, NotFoundError } from "./errors.js";

interface InputDto {
  tenantId: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
}

export interface TenantOutputDto {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UpdateTenant {
  async execute(dto: InputDto): Promise<TenantOutputDto> {
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundError("Tenant not found");
    }

    if (existingTenant.id === DEFAULT_TENANT_ID || existingTenant.slug === DEFAULT_TENANT_SLUG) {
      throw new ConflictError("Default tenant cannot be updated");
    }

    const nextName = dto.name?.trim() || existingTenant.name;
    const nextSlug = dto.slug ? normalizeTenantSlug(dto.slug) : existingTenant.slug;
    const nextIsActive = dto.isActive ?? existingTenant.isActive;

    buildTenantIdentity({
      tenantId: existingTenant.id,
      tenantSlug: nextSlug,
      name: nextName,
    });

    const duplicateWithSlug = await prisma.tenant.findUnique({
      where: { slug: nextSlug },
      select: { id: true },
    });

    if (duplicateWithSlug && duplicateWithSlug.id !== existingTenant.id) {
      throw new ConflictError("Tenant slug already exists");
    }

    const tenant = await prisma.tenant.update({
      where: { id: existingTenant.id },
      data: {
        name: nextName,
        slug: nextSlug,
        isActive: nextIsActive,
      },
    });

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }
}
