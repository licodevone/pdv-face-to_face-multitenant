import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import {
  CashMovementSchema,
  CashSessionSchema,
  CloseCashSessionSchema,
  CurrentCashSessionResponseSchema,
  ErrorSchema,
  OpenCashSessionSchema,
  RegisterCashMovementSchema,
  UpdateCashSessionOpeningAmountSchema,
} from "../schemas/index.js";
import { CloseCashSession } from "../use-cases/CloseCashSession.js";
import { GetCurrentCashSession } from "../use-cases/GetCurrentCashSession.js";
import { OpenCashSession } from "../use-cases/OpenCashSession.js";
import { RegisterCashMovement } from "../use-cases/RegisterCashMovement.js";
import { UpdateCashSessionOpeningAmount } from "../use-cases/UpdateCashSessionOpeningAmount.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const cashRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/sessions/current",
    schema: {
      tags: ["Cash Register"],
      summary: "Get current open cash session",
      response: {
        200: CurrentCashSessionResponseSchema,
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

        const getCurrentCashSession = new GetCurrentCashSession();
        return reply.send(
          await getCurrentCashSession.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/sessions/open",
    schema: {
      tags: ["Cash Register"],
      summary: "Open cash session",
      body: OpenCashSessionSchema,
      response: {
        201: CashSessionSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const context = await getSessionContext(request.headers);
        if (!context) {
          return sendUnauthorized(reply);
        }

        const openCashSession = new OpenCashSession();
        const cashSession = await openCashSession.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          openingAmountInCents: request.body.openingAmountInCents,
        });

        return reply.status(201).send(cashSession);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/sessions/:cashSessionId/movements",
    schema: {
      tags: ["Cash Register"],
      summary: "Register cash supply or withdrawal",
      params: z.object({ cashSessionId: z.uuid() }),
      body: RegisterCashMovementSchema,
      response: {
        201: CashMovementSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
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

        const registerCashMovement = new RegisterCashMovement();
        const movement = await registerCashMovement.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          cashSessionId: request.params.cashSessionId,
          ...request.body,
        });

        return reply.status(201).send(movement);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/sessions/:cashSessionId/opening-amount",
    schema: {
      tags: ["Cash Register"],
      summary: "Update the opening amount of the current open cash session",
      params: z.object({ cashSessionId: z.uuid() }),
      body: UpdateCashSessionOpeningAmountSchema,
      response: {
        200: CashSessionSchema,
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

        const updateCashSessionOpeningAmount = new UpdateCashSessionOpeningAmount();
        return reply.send(
          await updateCashSessionOpeningAmount.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            cashSessionId: request.params.cashSessionId,
            openingAmountInCents: request.body.openingAmountInCents,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/sessions/:cashSessionId/close",
    schema: {
      tags: ["Cash Register"],
      summary: "Close cash session with expected amount and profit",
      params: z.object({ cashSessionId: z.uuid() }),
      body: CloseCashSessionSchema,
      response: {
        200: CashSessionSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
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

        const closeCashSession = new CloseCashSession();
        return reply.send(
          await closeCashSession.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            cashSessionId: request.params.cashSessionId,
            ...request.body,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
