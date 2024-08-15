import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

import * as schema from "./schema";

const databaseURL = process.env.DATABASE_URL;

const sql = neon(databaseURL!);

const db = drizzle(sql, { schema });

export { db };
