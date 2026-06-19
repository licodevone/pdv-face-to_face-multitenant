import { BadRequestError } from "../errors/index.js";
import { findTenantOrThrow } from "../lib/tenant.js";

interface InputDto {
  tenantId?: string;
  tenantSlug?: string;
}

export interface TenantPublicContextOutputDto {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class GetTenantPublicContext {
  async execute(dto: InputDto): Promise<TenantPublicContextOutputDto> {
    if (!dto.tenantId && !dto.tenantSlug) {
      throw new BadRequestError("Tenant id or slug is required");
    }

    const tenant = await findTenantOrThrow({
      tenantId: dto.tenantId,
      tenantSlug: dto.tenantSlug,
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
