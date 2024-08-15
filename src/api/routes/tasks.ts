import { count, eq } from "drizzle-orm";
import express from "express";

import { db, tasksTable } from "../../db";
import { omitObjectKey, dateSchema } from "../../helper";
import { getTasksByTokenAndID, getUserByToken } from "../helper";

const router = express.Router();

router.get("/", async (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];
  const page = req.query.page && !isNaN(+req.query.page) ? +req.query.page : 1;
  const limit =
    req.query.limit && !isNaN(+req.query.limit) ? +req.query.limit : 10;

  if (token) {
    const user = await getUserByToken(token);
    if (user?.id) {
      const offset = (page - 1) * limit;
      const totalDocs =
        (
          await db
            .select({ count: count() })
            .from(tasksTable)
            .where(eq(tasksTable.userId, user?.id))
        )?.[0]?.count ?? 0;

      const totalPages = Math.ceil(totalDocs / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const tasks = {
        tasks: await db
          .select({
            id: tasksTable.id,
            title: tasksTable.title,
            dueDate: tasksTable.dueDate,
            description: tasksTable.description,
            status: tasksTable.status,
          })
          .from(tasksTable)
          .where(eq(tasksTable.userId, user?.id))
          .limit(limit)
          .offset(offset),
        hasNextPage,
        hasPrevPage,
        limit,
        nextPage: hasNextPage ? page + 1 : null,
        page,
        pagingCounter: (page - 1) * limit + 1,
        prevPage: hasPrevPage ? page - 1 : null,
        totalDocs,
        totalPages,
      };

      return res.send(tasks);
    } else {
      return res.status(403).send({
        message: "Cannot find user.",
      });
    }
  } else {
    return res.status(403).send({
      message: "Unauthorized.",
    });
  }
});

router.post("/create-task", async (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];
  const { title, dueDate, description } = req.body;

  if (!title || title?.trim() === "") {
    return res.status(400).send({
      message: !title ? "Title should be required field" : "Enter valid title.",
    });
  } else if (token) {
    const user = await getUserByToken(token);
    if (user?.id) {
      try {
        const tasks = (
          await db
            .insert(tasksTable)
            .values({
              title: title?.trim(),
              userId: user?.id,
              dueDate: dueDate ? new Date(dateSchema.parse(dueDate)) : null,
              description: description?.trim() ?? null,
            })
            .returning()
        )?.[0];

        if (!tasks) {
          return res.status(400).send({
            message: "Cannot create task.",
          });
        }

        return res.send(omitObjectKey(tasks, ["userId", "createdAt"]));
      } catch (err) {
        return res.status(400).send(err);
      }
    } else {
      return res.status(403).send({
        message: "Cannot find user.",
      });
    }
  } else {
    return res.status(403).send({
      message: "Access denied",
    });
  }
});

router.patch("/update-task", async (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];
  const { id, title, dueDate, description, status } = req.body;

  if (
    !id ||
    typeof id !== "string" ||
    id?.trim() === "" ||
    (!title && !dueDate && !description && !status) ||
    (status && (status !== "pending" || status !== "completed"))
  ) {
    return res.status(400).send({
      message: !id
        ? "ID should be required field."
        : id?.trim() === ""
        ? "Enter valid ID."
        : status && (status !== "pending" || status !== "completed")
        ? "Invalid status"
        : !title && !dueDate && !description && !status
        ? "Either provide tile, Due date, description, status."
        : "Something went wrong.",
    });
  } else if (token) {
    try {
      const user = await getUserByToken(token);

      if (user?.id) {
        const task = await getTasksByTokenAndID(user, id);

        if (task?.id) {
          const updatedTask = (
            await db
              .update(tasksTable)
              .set({
                title: title ?? undefined,
                dueDate: dueDate ? new Date(dateSchema.parse(dueDate)) : null,
                description: description ?? undefined,
                status: status ?? undefined,
              })
              .where(eq(tasksTable.id, task?.id))
              .returning()
          )?.[0];

          if (updatedTask?.id) {
            return res.send(
              omitObjectKey(updatedTask, ["userId", "createdAt"])
            );
          } else {
            return res.status(400).send({
              message: "Cannot update task.",
            });
          }
        } else {
          return res.status(401).send({
            message: "Cannot find task.",
          });
        }
      } else {
        return res.status(403).send({
          message: "Cannot find user.",
        });
      }
    } catch (e) {
      return res.status(400).send(e);
    }
  } else {
    return res.status(403).send({
      message: "Access denied",
    });
  }
});

router.delete("/delete-task/:id", async (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];
  const id = req.params.id;
  if (!id || id?.trim() === "") {
    return res.status(400).send({
      message: !id ? "ID should be required field" : "Enter valid ID",
    });
  }
  if (token) {
    try {
      const user = await getUserByToken(token);

      if (user?.id) {
        const task = await getTasksByTokenAndID(user, id);

        if (task?.id) {
          const deletedTask = (
            await db.delete(tasksTable).where(eq(tasksTable.id, id)).returning()
          )?.[0];

          if (!deletedTask?.id) {
            return res.status(400).send({
              message: "Cannot delete the given task.",
            });
          }

          return res.send(deletedTask);
        } else {
          return res.status(401).send({
            message: "Cannot find task.",
          });
        }
      } else {
        return res.status(403).send({
          message: "Cannot find user.",
        });
      }
    } catch (e) {
      return res.status(400).send(e);
    }
  } else {
    return res.status(403).send({
      message: "Access denied",
    });
  }
});

export default router;
