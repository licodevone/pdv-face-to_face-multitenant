import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import {
  CreateCustomerSchema,
  CustomerListQuerySchema,
  CustomerSchema,
  DeleteCustomerResponseSchema,
  ErrorSchema,
  UpdateCustomerSchema,
} from "../schemas/index.js";
import { CreateCustomer } from "../use-cases/CreateCustomer.js";
import { DeleteCustomer } from "../use-cases/DeleteCustomer.js";
import { ListCustomers } from "../use-cases/ListCustomers.js";
import { UpdateCustomer } from "../use-cases/UpdateCustomer.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const customersRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Customers"],
      summary: "List customers",
      querystring: CustomerListQuerySchema,
      response: {
        200: z.object({ customers: CustomerSchema.array() }),
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

        const listCustomers = new ListCustomers();
        return reply.send(
          await listCustomers.execute({
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
    method: "POST",
    url: "/",
    schema: {
      tags: ["Customers"],
      summary: "Create a customer",
      body: CreateCustomerSchema,
      response: {
        201: CustomerSchema,
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

        const createCustomer = new CreateCustomer();
        const customer = await createCustomer.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          ...request.body,
        });

        return reply.status(201).send(customer);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:customerId",
    schema: {
      tags: ["Customers"],
      summary: "Update a customer",
      params: z.object({ customerId: z.uuid() }),
      body: UpdateCustomerSchema,
      response: {
        200: CustomerSchema,
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

        const updateCustomer = new UpdateCustomer();
        return reply.send(
          await updateCustomer.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            customerId: request.params.customerId,
            ...request.body,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/:customerId",
    schema: {
      tags: ["Customers"],
      summary: "Delete a customer",
      params: z.object({ customerId: z.uuid() }),
      response: {
        200: DeleteCustomerResponseSchema,
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

        const deleteCustomer = new DeleteCustomer();
        return reply.send(
          await deleteCustomer.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            customerId: request.params.customerId,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
