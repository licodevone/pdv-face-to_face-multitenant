import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import { DEFAULT_TENANT_ID, DEFAULT_TENANT_SLUG } from "../lib/tenant.js";
import { ConflictError, NotFoundError } from "./errors.js";

interface InputDto {
  tenantId: string;
}

interface OutputDto {
  deleted: true;
}

export class DeleteTenant {
  async execute(dto: InputDto): Promise<OutputDto> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    if (tenant.id === DEFAULT_TENANT_ID || tenant.slug === DEFAULT_TENANT_SLUG) {
      throw new ConflictError("Default tenant cannot be deleted");
    }

    try {
      await prisma.tenant.delete({
        where: { id: tenant.id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError("Tenant has related records and cannot be deleted");
      }

      throw error;
    }

    return { deleted: true };
  }
}
