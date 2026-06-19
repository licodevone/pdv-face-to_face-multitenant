import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import {
  ErrorSchema,
  FinancialReportQuerySchema,
  FinancialReportSchema,
} from "../schemas/index.js";
import { GetFinancialReport } from "../use-cases/GetFinancialReport.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const reportsRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/financial",
    schema: {
      tags: ["Reports"],
      summary: "Get daily and monthly financial report",
      querystring: FinancialReportQuerySchema,
      response: {
        200: FinancialReportSchema,
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

        const getFinancialReport = new GetFinancialReport();
        return reply.send(
          await getFinancialReport.execute({
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
};
