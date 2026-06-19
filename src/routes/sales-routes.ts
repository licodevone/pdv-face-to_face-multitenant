import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import { ErrorSchema, RegisterSaleSchema, SaleSchema } from "../schemas/index.js";
import { GetSale } from "../use-cases/GetSale.js";
import { RegisterSale } from "../use-cases/RegisterSale.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const salesRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Sales"],
      summary: "Register a sale with payments, stock write-off and fiscal status",
      body: RegisterSaleSchema,
      response: {
        201: SaleSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
        422: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const registerSale = new RegisterSale();
        const sale = await registerSale.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          ...request.body,
        });

        return reply.status(201).send(sale);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:saleId",
    schema: {
      tags: ["Sales"],
      summary: "Get a sale by id",
      params: z.object({ saleId: z.uuid() }),
      response: {
        200: SaleSchema,
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

        const getSale = new GetSale();
        return reply.send(
          await getSale.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            saleId: request.params.saleId,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
