import express from "express";
import bcrypt from "bcrypt";
import { NeonDbError } from "@neondatabase/serverless";
import { z } from "zod";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import "dotenv/config";

import { insertUserSchema, usersTable, db } from "../../db";
import { emailZodSchema, passwordZodSchema } from "../../helper";

const router = express.Router();

router.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = insertUserSchema.parse({
      name: name?.trim(),
      email: email.trim(),
      password,
    });

    const results = await db
      .insert(usersTable)
      .values({ ...newUser, password: hashedPassword })
      .returning();

    if (!results || results.length < 1) {
      return res.status(400).send({ message: "User could not be created." });
    }

    return res.send({
      message: "User creation successful.",
    });
  } catch (e) {
    const error = e as unknown as NeonDbError;
    return res
      .status(400)
      .send(
        error.constraint === "users_table_email_unique"
          ? { message: "Email already exist." }
          : error ?? { message: "Error encountered" }
      );
  }
});

router.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userDetail = z
      .object({
        email: emailZodSchema,
        password: passwordZodSchema,
      })
      .parse({ email, password });

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, userDetail?.email),
    });

    if (!user) {
      return res.status(401).send({
        message: "Cannot find user.",
      });
    }

    const isValidPassword = await bcrypt.compare(
      userDetail?.password,
      user?.password
    );

    if (isValidPassword) {
      const token = jwt.sign(
        {
          name: user?.name,
          email: user?.email,
          id: user?.id,
        },
        process.env.ACCESS_TOKEN_SECRET!,
        {
          expiresIn: "30d",
        }
      );
      return res.send({
        token,
        user: { name: user?.name, email: user?.email, id: user?.id },
      });
    } else {
      return res.status(401).send({
        message: "invalid credentials.",
      });
    }
  } catch (e) {
    const error = e as unknown as NeonDbError;
    return res.status(400).send(error ?? { message: "Error encountered" });
  }
});

export default router;
