import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import * as middlewares from "./middlewares";
import api from "./api";

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Hello welcome.");
});

app.use("/api", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
