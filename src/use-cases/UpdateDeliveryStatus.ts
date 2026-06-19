import { prisma } from "../lib/db.js";
import { NotFoundError } from "./errors.js";
import { DeliveryOrderOutputDto } from "./ListDeliveryOrders.js";
import { ensureOperator } from "./permissions.js";

interface InputDto {
  operatorId: string;
  tenantId: string;
  deliveryOrderId: string;
  status: "RECEIVED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
}

export class UpdateDeliveryStatus {
  async execute(dto: InputDto): Promise<DeliveryOrderOutputDto> {
    await ensureOperator({
      operatorId: dto.operatorId,
      tenantId: dto.tenantId,
      allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    });

    const existingOrder = await prisma.deliveryOrder.findFirst({
      where: { id: dto.deliveryOrderId, tenantId: dto.tenantId },
    });

    if (!existingOrder) {
      throw new NotFoundError("Delivery order not found");
    }

    const order = await prisma.deliveryOrder.update({
      where: {
        id_tenantId: {
          id: dto.deliveryOrderId,
          tenantId: dto.tenantId,
        },
      },
      data: { status: dto.status },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.operatorId,
        action: "DELIVERY_STATUS_UPDATED",
        entity: "DeliveryOrder",
        entityId: order.id,
        metadata: { from: existingOrder.status, to: dto.status },
      },
    });

    return {
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
    };
  }
}
