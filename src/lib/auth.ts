import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
      },
      bankBin: {
        type: "string",
        required: false,
      },
      bankAccountNo: {
        type: "string",
        required: false,
      },
      bankAccountName: {
        type: "string",
        required: false,
      },
      bankAccountKeyVersion: {
        type: "number",
        required: false,
        defaultValue: 1,
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
});
