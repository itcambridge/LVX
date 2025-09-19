import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  max: 1, // lightweight for serverless/Linode
});
export const db = drizzle(client);
