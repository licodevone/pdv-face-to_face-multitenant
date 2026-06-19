import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import { CustomerOutputDto } from "./CreateCustomer.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  search?: string;
}

interface OutputDto {
  customers: CustomerOutputDto[];
}

export class ListCustomers {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const where: Prisma.CustomerWhereInput = dto.search
      ? {
          tenantId: dto.tenantId,
          OR: [
            { name: { contains: dto.search, mode: "insensitive" } },
            { cpf: { contains: dto.search, mode: "insensitive" } },
            { phone: { contains: dto.search, mode: "insensitive" } },
            { loyaltyCode: { contains: dto.search, mode: "insensitive" } },
          ],
        }
      : { tenantId: dto.tenantId };

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: 100,
    });

    return {
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        cpf: customer.cpf,
        phone: customer.phone,
        email: customer.email,
        loyaltyCode: customer.loyaltyCode,
        address: customer.address,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      })),
    };
  }
}
