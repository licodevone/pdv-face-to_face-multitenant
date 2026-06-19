import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import { ErrorSchema, SignatureSchema, SignSaleSchema } from "../schemas/index.js";
import { SignSale } from "../use-cases/SignSale.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const signaturesRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/sales/:saleId",
    schema: {
      tags: ["Signatures"],
      summary: "Register digital signature from tablet",
      params: z.object({ saleId: z.uuid() }),
      body: SignSaleSchema,
      response: {
        200: SignatureSchema,
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

        const signSale = new SignSale();
        return reply.send(
          await signSale.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            saleId: request.params.saleId,
            signatureImageUrl: request.body.signatureImageUrl,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
