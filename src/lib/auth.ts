import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { env, trustedOrigins } from "../env.js";
import { prisma } from "./db.js";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [openAPI()],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CASHIER",
        input: false,
      },
      tenantId: {
        type: "string",
        required: false,
        defaultValue: "default",
        input: false,
      },
    },
  },
});
