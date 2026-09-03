import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
