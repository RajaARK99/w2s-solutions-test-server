import jwt from "jsonwebtoken";
import { and, eq } from "drizzle-orm";

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

export { getUserByToken, getTasksByTokenAndID };
