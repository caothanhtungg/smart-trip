import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              emailVerified: true,
            },
          };
        },
      },
    },
  },
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
  session: {
    // Phiên tuyệt đối hết hạn sau 7 ngày, kể cả khi người dùng còn hoạt động.
    expiresIn: 60 * 60 * 24 * 7,
    disableSessionRefresh: true,
  },
  advanced: {
    // Secure được Better Auth áp dụng ở production; SameSite/Lax cho OAuth callback
    // và HttpOnly ngăn JavaScript phía client đọc session token.
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
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
