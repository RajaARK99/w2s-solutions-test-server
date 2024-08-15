import jwt from "jsonwebtoken";
import { and, count, eq, sql } from "drizzle-orm";

import { db, Task, tasksTable, User, usersTable } from "../db";

const getUserByToken = async (token: string): Promise<User | null> => {
  const payload = jwt.decode(token);

  if (payload && typeof payload === "object" && payload?.id && payload?.email) {
    return (
      (await db.query.usersTable.findFirst({
        where: eq(usersTable.id, payload?.id),
      })) ?? null
    );
  } else {
    return null;
  }
};

const getTasksByTokenAndID = async (
  user: User,
  id: string
): Promise<Task | null> => {
  return (
    (
      await db
        .select()
        .from(tasksTable)
        .where(and(eq(tasksTable?.id, id), eq(tasksTable.userId, user?.id)))
        .limit(1)
    )?.[0] ?? null
  );
};

const getTaskMetrics = async (user: User) => {
  const totalTasks = (
    await db
      .select({
        count: count(),
      })
      .from(tasksTable)
      .where(eq(tasksTable.userId, user?.id))
  )?.[0]?.count;

  const pendingTasks = (
    await db
      .select({
        count: count(),
      })
      .from(tasksTable)
      .where(
        and(eq(tasksTable.userId, user?.id), eq(tasksTable.status, "pending"))
      )
  )?.[0]?.count;

  const holdTasks = (
    await db
      .select({
        count: count(),
      })
      .from(tasksTable)
      .where(
        and(eq(tasksTable.userId, user?.id), eq(tasksTable.status, "hold"))
      )
  )?.[0]?.count;

  const completedTasks = (
    await db
      .select({
        count: count(),
      })
      .from(tasksTable)
      .where(
        and(eq(tasksTable.userId, user?.id), eq(tasksTable.status, "completed"))
      )
  )?.[0]?.count;

  return {
    total: totalTasks || 0,
    pending: pendingTasks || 0,
    hold: holdTasks || 0,
    completed: completedTasks || 0,
  };
};

const getTasksByMonth = async (user: User, year: number) => {
  const results = await db
    .select({
      month: sql`TO_CHAR(${tasksTable.createdAt}, 'Month')`.as<string>(),
      monthNumber:
        sql`EXTRACT(MONTH FROM ${tasksTable.createdAt})`.as<number>(),
      tasks: count(),
    })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, user?.id),
        sql`EXTRACT(YEAR FROM ${tasksTable.createdAt}) = ${year}`
      )
    )
    .groupBy(
      sql`EXTRACT(MONTH FROM ${tasksTable.createdAt})`,
      sql`TO_CHAR(${tasksTable.createdAt}, 'Month')`
    )
    .orderBy(sql`EXTRACT(MONTH FROM ${tasksTable.createdAt})`);

  const chartData = results.map((row) => ({
    month: row.month.trim(),
    tasks: row?.tasks ?? 0,
  }));

  return chartData;
};

const getTotalTasksByYear = async (user: User, year: number) => {
  const results = await db
    .select({
      count: count(),
    })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, user?.id),
        sql`EXTRACT(YEAR FROM ${tasksTable.createdAt}) = ${year}`
      )
    );

  return results?.[0]?.count ?? 0;
};
export {
  getUserByToken,
  getTasksByTokenAndID,
  getTaskMetrics,
  getTasksByMonth,
  getTotalTasksByYear,
};
