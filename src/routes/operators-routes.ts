import { APIError } from "better-auth/api";
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import { auth } from "../lib/auth.js";
import {
  ChangeOperatorPasswordResponseSchema,
  ChangeOperatorPasswordSchema,
  CreateOperatorSchema,
  ErrorSchema,
  ListOperatorsResponseSchema,
  OperatorProfileSchema,
  UpdateOperatorSchema,
  UpdateOperatorProfileSchema,
} from "../schemas/index.js";
import { CreateOperator } from "../use-cases/CreateOperator.js";
import { GetOperatorProfile } from "../use-cases/GetOperatorProfile.js";
import { ListOperators } from "../use-cases/ListOperators.js";
import { UpdateOperator } from "../use-cases/UpdateOperator.js";
import { UpdateOperatorProfile } from "../use-cases/UpdateOperatorProfile.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const operatorsRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Operators"],
      summary: "List tenant operators",
      response: {
        200: ListOperatorsResponseSchema,
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

        const listOperators = new ListOperators();
        const operators = await listOperators.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
        });

        return reply.send({ operators });
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Operators"],
      summary: "Create tenant operator",
      body: CreateOperatorSchema,
      response: {
        201: OperatorProfileSchema,
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

        const createOperator = new CreateOperator();
        const operator = await createOperator.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          ...request.body,
        });

        return reply.status(201).send(operator);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/me",
    schema: {
      tags: ["Operators"],
      summary: "Get current operator profile",
      response: {
        200: z.object({ operator: OperatorProfileSchema }),
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

        const getOperatorProfile = new GetOperatorProfile();
        const operator = await getOperatorProfile.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
        });
        return reply.send({ operator });
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/me",
    schema: {
      tags: ["Operators"],
      summary: "Update current operator profile",
      body: UpdateOperatorProfileSchema,
      response: {
        200: z.object({ operator: OperatorProfileSchema }),
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
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

        const updateOperatorProfile = new UpdateOperatorProfile();
        const operator = await updateOperatorProfile.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          ...request.body,
        });

        return reply.send({ operator });
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/me/password",
    schema: {
      tags: ["Operators"],
      summary: "Change current operator password",
      body: ChangeOperatorPasswordSchema,
      response: {
        200: ChangeOperatorPasswordResponseSchema,
        400: ErrorSchema,
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

        await auth.api.changePassword({
          body: {
            currentPassword: request.body.currentPassword,
            newPassword: request.body.newPassword,
            revokeOtherSessions: request.body.revokeOtherSessions ?? true,
          },
          headers: fromNodeHeaders(request.headers),
        });

        return reply.send({ changed: true });
      } catch (error) {
        if (error instanceof APIError) {
          const statusCode = [400, 401, 403, 500].includes(error.statusCode)
            ? (error.statusCode as 400 | 401 | 403 | 500)
            : 500;

          return reply.status(statusCode).send({
            error: error.body?.message ?? "Failed to change password",
            code: typeof error.body?.code === "string" ? error.body.code : String(error.status),
          });
        }

        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:operatorId",
    schema: {
      tags: ["Operators"],
      summary: "Update tenant operator",
      params: z.object({ operatorId: z.string().min(1) }),
      body: UpdateOperatorSchema,
      response: {
        200: OperatorProfileSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema,
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

        const updateOperator = new UpdateOperator();
        const operator = await updateOperator.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          targetOperatorId: request.params.operatorId,
          ...request.body,
        });

        return reply.send(operator);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
