import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { eq } from "drizzle-orm";

import { authRoute, tasksRouter } from "./routes/index";
import { db, usersTable } from "./db/index";

const app = express();

app.use(cors({ credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

app.get("/", (_req, res) => {
  return res.send("Hello welcome.");
});

app.use("/auth", authRoute);
app.use(
  "/tasks",
  (req, res, next) => {
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
  },
  tasksRouter
);

const server = http.createServer(app);

const port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log("Server running...");
});

export default server;
