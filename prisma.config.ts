import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function getMigrationDatasourceUrl(): string {
  const directUrl = process.env.DIRECT_URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    // Phát hiện Transaction Connection Pooler (Supabase port 6543 hoặc query param pgbouncer=true)
    const isPooler = databaseUrl.includes(":6543") || databaseUrl.includes("pgbouncer=true");
    const isMigrateCmd = process.argv.some((arg) => arg.includes("migrate"));
    if (isPooler && isMigrateCmd) {
      throw new Error(
        "[Prisma CLI Protection] Phát hiện DATABASE_URL đang trỏ đến Transaction Connection Pooler (port 6543 / pgbouncer=true). " +
        "Prisma Migrate yêu cầu DIRECT_URL (Direct Connection port 5432) để thực thi DDL và advisory locks. " +
        "Vui lòng thiết lập biến DIRECT_URL trong .env trước khi thực thi các lệnh migration."
      );
    }
    return databaseUrl;
  }

  return env("DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: getMigrationDatasourceUrl(),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
