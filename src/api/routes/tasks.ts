import { count, eq } from "drizzle-orm";
import express from "express";
import jwt from "jsonwebtoken";

import { db, tasksTable } from "../../db/index";
import { omitObjectKey, dateSchema } from "../../helper/index";

const tasksRouter = express.Router();

tasksRouter.get("/", (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];
  const page = req.query.page && !isNaN(+req.query.page) ? +req.query.page : 1;
  const limit =
    req.query.limit && !isNaN(+req.query.limit) ? +req.query.limit : 10;

  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, async (err, user) => {
      if (err) {
        return res.status(403).send({
          message: "Unauthorized",
        });
      }

      if (user && typeof user !== "string" && user?.id && user?.email) {
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
            task: await db
              .select({
                id: tasksTable.id,
                title: tasksTable.title,
                dueDate: tasksTable.dueDate,
                description: tasksTable.description,
                isCompleted: tasksTable.isCompleted,
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
            message: "Unauthorized",
          });
        }
      } else {
        return res.status(403).send({
          message: "Unauthorized",
        });
      }
    });
  } else {
    return res.status(403).send({
      message: "Access denied",
    });
  }
});

tasksRouter.post("/create-task", (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];
  const { title, dueDate, description, isCompleted } = req.body;

  if (!title || title?.trim() === "") {
    return res.status(400).send({
      message: !title ? "Title should be required field" : "Enter valid title.",
    });
  } else if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, async (err, user) => {
      if (err) {
        return res.status(403).send({
          message: "Unauthorized",
        });
      }

      if (user && typeof user !== "string" && user?.id && user?.email) {
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
                  isCompleted:
                    typeof isCompleted === "boolean" ? isCompleted : false,
                })
                .returning()
            )?.[0];

            if (!tasks) {
              return res.status(400).send({
                message: "Cannot create task.",
              });
            }

            return res.send(omitObjectKey(tasks, ["userId"]));
          } catch (err) {
            return res.status(400).send(err);
          }
        } else {
          return res.status(403).send({
            message: "Unauthorized",
          });
        }
      } else {
        return res.status(403).send({
          message: "Unauthorized",
        });
      }
    });
  } else {
    return res.status(403).send({
      message: "Access denied",
    });
  }
});

tasksRouter.patch("/update-task", async (req, res) => {
  const { id, title, dueDate, description, isCompleted } = req.body;

  if (
    !id ||
    typeof id !== "string" ||
    id?.trim() === "" ||
    (!title &&
      !dueDate &&
      !description &&
      (isCompleted === undefined || isCompleted === null))
  ) {
    return res.status(400).send({
      message: !id
        ? "ID should be required field."
        : id?.trim() === ""
        ? "Enter valid ID."
        : !title &&
          !dueDate &&
          !description &&
          (isCompleted === undefined || isCompleted === null)
        ? "Either provide tile, Due date, description, isCompleted."
        : "Something went wrong.",
    });
  } else {
    try {
      const task = await db.query.tasksTable.findFirst({
        where: eq(tasksTable.id, id),
      });

      if (task?.id) {
        const updatedTask = (
          await db
            .update(tasksTable)
            .set({
              title: title ?? undefined,
              dueDate: dueDate ? new Date(dateSchema.parse(dueDate)) : null,
              description: description ?? undefined,
              isCompleted:
                typeof isCompleted === "boolean" ? isCompleted : undefined,
            })
            .where(eq(tasksTable.id, task?.id))
            .returning()
        )?.[0];

        if (updatedTask?.id) {
          return res.send(omitObjectKey(updatedTask, ["userId"]));
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
    } catch (e) {
      return res.status(400).send(e);
    }
  }
});

tasksRouter.delete("/delete-task", async (req, res) => {
  const { id } = req.body;

  if (!id || id?.trim() === "") {
    return res.status(400).send({
      message: !id ? "ID should be required field" : "Enter valid ID",
    });
  } else {
    try {
      const task = await db.query.tasksTable.findFirst({
        where: eq(tasksTable.id, id),
      });

      if (task?.id) {
        const deletedTask = (
          await db.delete(tasksTable).where(eq(tasksTable.id, id)).returning()
        )?.[0];

        if (!deletedTask?.id) {
          return res.status(400).send({
            message: "Cannot delete the given task.",
          });
        }

        return res.send({
          task: deletedTask,
        });
      } else {
        return res.status(400).send({
          message: "Cannot find task.",
        });
      }
    } catch (e) {
      return res.status(500).send(e);
    }
  }
});

export { tasksRouter };
