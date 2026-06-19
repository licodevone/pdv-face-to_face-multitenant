import { prisma } from "../lib/db.js";

export interface TenantListItemOutputDto {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ListTenantsPublicContext {
  async execute(): Promise<TenantListItemOutputDto[]> {
    const tenants = await prisma.tenant.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    }));
  }
}
