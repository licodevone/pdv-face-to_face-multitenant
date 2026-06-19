import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import {
  DeliveryListQuerySchema,
  DeliveryOrderSchema,
  ErrorSchema,
  UpdateDeliveryStatusSchema,
} from "../schemas/index.js";
import { ListDeliveryOrders } from "../use-cases/ListDeliveryOrders.js";
import { UpdateDeliveryStatus } from "../use-cases/UpdateDeliveryStatus.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const deliveryRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Delivery"],
      summary: "List delivery orders",
      querystring: DeliveryListQuerySchema,
      response: {
        200: z.object({ deliveryOrders: DeliveryOrderSchema.array() }),
        401: ErrorSchema,
        403: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const listDeliveryOrders = new ListDeliveryOrders();
        return reply.send(
          await listDeliveryOrders.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            ...request.query,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:deliveryOrderId/status",
    schema: {
      tags: ["Delivery"],
      summary: "Update delivery status",
      params: z.object({ deliveryOrderId: z.uuid() }),
      body: UpdateDeliveryStatusSchema,
      response: {
        200: DeliveryOrderSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const updateDeliveryStatus = new UpdateDeliveryStatus();
        return reply.send(
          await updateDeliveryStatus.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            deliveryOrderId: request.params.deliveryOrderId,
            status: request.body.status,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
