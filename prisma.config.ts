import "dotenv/config";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const datasourceUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"];

if (!datasourceUrl) {
  throw new Error("DIRECT_URL ou DATABASE_URL precisa estar definido.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
