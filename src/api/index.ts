import express, { NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import authRoute from "./routes/auth";
import tasksRoute from "./routes/tasks";
import dashboardRoute from "./routes/dashboard";

import { db, usersTable } from "../db";

const router = express.Router();

const authenticateFunction = (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];

  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, async (err, user) => {
      if (err) {
        return res.status(403).send({
          message: "Unauthorized",
        });
      }

      if (user && typeof user !== "string" && user?.id && user?.email) {
        const userDetail = await db.query.usersTable.findFirst({
          where: eq(usersTable.id, user?.id),
        });

        if (userDetail?.id) {
          next();
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
};

router.use("/auth", authRoute);
router.use("/tasks", authenticateFunction, tasksRoute);

router.use("/dashboard", authenticateFunction, dashboardRoute);

export default router;
