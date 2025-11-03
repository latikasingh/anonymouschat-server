import cors from "cors";
import express from "express";
import Routes from "./route";
import { globalErrorHandler } from "./middleware/globalError.middleware";
import { createServer } from "http";
import { setupSocket } from "./helpers/socket";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api", Routes);

//socker
const server = createServer(app);
setupSocket(server);

app.use(globalErrorHandler);

app.get("/", (req, res) => {
  res.status(200).send("Chat server is running!");
});

export { app, server };
