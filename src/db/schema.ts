import {
  boolean,
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { nameZodSchema, passwordZodSchema } from "../helper/index";

const usersTable = pgTable("users_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

const tasksTable = pgTable("tasks_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  isCompleted: boolean("is_completed").notNull().default(false),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const insertUserSchema = createInsertSchema(usersTable, {
  email: z.string().email(),
  password: passwordZodSchema,
  name: nameZodSchema,
});

const insertTaskSchema = createInsertSchema(tasksTable);

type InsertUser = typeof usersTable.$inferInsert;
type User = typeof usersTable.$inferSelect;
type InsertTask = typeof tasksTable.$inferInsert;
type Task = typeof tasksTable.$inferSelect;

export { usersTable, tasksTable, insertUserSchema, insertTaskSchema };
export type { User, InsertUser, Task, InsertTask };
