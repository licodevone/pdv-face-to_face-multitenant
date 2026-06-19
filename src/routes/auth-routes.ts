import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";

import { auth } from "../lib/auth.js";

export const authRoutes = async (app: FastifyInstance) => {
  app.route({
    method: ["GET", "POST"],
    url: "/*",
    handler: async (request, reply) => {
      try {
        const host = request.headers.host ?? "localhost";
        const url = new URL(request.url, `http://${host}`);
        const req = new Request(url.toString(), {
          method: request.method,
          headers: fromNodeHeaders(request.headers),
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        });
        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));

        return reply.send(response.body ? await response.text() : null);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal authentication error",
          code: "AUTH_FAILURE",
        });
      }
    },
  });
};
