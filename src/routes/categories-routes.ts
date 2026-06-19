import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

import {
  CategoryListQuerySchema,
  CategorySchema,
  CreateCategorySchema,
  DeleteCategoryResponseSchema,
  ErrorSchema,
  UpdateCategorySchema,
} from "../schemas/index.js";
import { CreateCategory } from "../use-cases/CreateCategory.js";
import { DeleteCategory } from "../use-cases/DeleteCategory.js";
import { GetCategory } from "../use-cases/GetCategory.js";
import { ListCategories } from "../use-cases/ListCategories.js";
import { UpdateCategory } from "../use-cases/UpdateCategory.js";
import { sendRouteError, sendUnauthorized } from "./route-errors.js";
import { getSessionContext } from "./session.js";

export const categoriesRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Categories"],
      summary: "List categories",
      querystring: CategoryListQuerySchema,
      response: {
        200: z.object({ categories: CategorySchema.array() }),
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

        const listCategories = new ListCategories();
        return reply.send(
          await listCategories.execute({
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
    method: "GET",
    url: "/:categoryId",
    schema: {
      tags: ["Categories"],
      summary: "Get a category by id",
      params: z.object({ categoryId: z.uuid() }),
      response: {
        200: CategorySchema,
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

        const getCategory = new GetCategory();
        return reply.send(
          await getCategory.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            categoryId: request.params.categoryId,
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
      tags: ["Categories"],
      summary: "Create a category",
      body: CreateCategorySchema,
      response: {
        201: CategorySchema,
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

        const createCategory = new CreateCategory();
        const category = await createCategory.execute({
          operatorId: context.userId,
          tenantId: context.tenantId,
          ...request.body,
        });

        return reply.status(201).send(category);
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/:categoryId",
    schema: {
      tags: ["Categories"],
      summary: "Update a category",
      params: z.object({ categoryId: z.uuid() }),
      body: UpdateCategorySchema,
      response: {
        200: CategorySchema,
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

        const updateCategory = new UpdateCategory();
        return reply.send(
          await updateCategory.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            categoryId: request.params.categoryId,
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
    url: "/:categoryId",
    schema: {
      tags: ["Categories"],
      summary: "Delete a category",
      params: z.object({ categoryId: z.uuid() }),
      response: {
        200: DeleteCategoryResponseSchema,
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

        const deleteCategory = new DeleteCategory();
        return reply.send(
          await deleteCategory.execute({
            operatorId: context.userId,
            tenantId: context.tenantId,
            categoryId: request.params.categoryId,
          }),
        );
      } catch (error) {
        return sendRouteError({ app, reply, error });
      }
    },
  });
};
