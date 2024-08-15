import express from "express";
import {
  getTaskMetrics,
  getUserByToken,
  getTasksByMonth,
  getTotalTasksByYear,
} from "../helper";

const router = express.Router();

router.get("/metrics", async (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];

  if (token) {
    const user = await getUserByToken(token);
    if (user?.id) {
      const metrics = await getTaskMetrics(user);

      return res.send(metrics);
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

router.get("/month-metrics", async (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];

  const year =
    req.query.year && !isNaN(+req.query.year)
      ? +req.query.year
      : new Date().getFullYear();

  if (token) {
    const user = await getUserByToken(token);
    if (user?.id) {
      const monthDetails = await getTasksByMonth(user, year);

      return res.send(monthDetails);
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

router.get("/year-metrics", async (req, res) => {
  const token = req?.headers?.["authorization"]?.split(" ")?.[1];

  const year =
    req.query.year && !isNaN(+req.query.year)
      ? +req.query.year
      : new Date().getFullYear();

  if (token) {
    const user = await getUserByToken(token);
    if (user?.id) {
      const tasks = await getTotalTasksByYear(user, year);

      return res.send({
        year,
        tasks,
      });
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
export default router;
