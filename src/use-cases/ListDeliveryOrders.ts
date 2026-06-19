import { prisma } from "../lib/db.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  status?: "RECEIVED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
}

export interface DeliveryOrderOutputDto {
  id: string;
  saleId: string;
  customerId: string | null;
  trackingCode: string;
  recipientName: string;
  phone: string | null;
  address: string;
  notes: string | null;
  status: "RECEIVED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

interface OutputDto {
  deliveryOrders: DeliveryOrderOutputDto[];
}

export class ListDeliveryOrders {
  async execute(dto: InputDto): Promise<OutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: {
        tenantId: dto.tenantId,
        ...(dto.status ? { status: dto.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return {
      deliveryOrders: deliveryOrders.map((order) => ({
        id: order.id,
        saleId: order.saleId,
        customerId: order.customerId,
        trackingCode: order.trackingCode,
        recipientName: order.recipientName,
        phone: order.phone,
        address: order.address,
        notes: order.notes,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })),
    };
  }
}
