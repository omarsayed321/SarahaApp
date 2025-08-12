import path from "node:path";
import * as dotenv from "dotenv";
// dotenv.config({ path: path.join("./src/config/.env.dev") });
dotenv.config({})
import express from "express";
import connectDB from "./DB/connection.db.js";
import userController from "./modules/user/user.controller.js";
import authController from "./modules/auth/auth.controller.js";
import messageController from "./modules/message/message.controller.js";
import { globalErrorHandling } from "./utils/response.js";
import cors from "cors";
import helmet from "helmet";
import {rateLimit} from "express-rate-limit";

const bootstrap = async () => {
  const app = express();
  const port = process.env.PORT || 5000;
  
  // DB
  await connectDB();

  // convert buffer data
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve("./src/uploads")));

  // app routing
  app.use(cors());
  app.use(helmet());

  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20000,
    message: {error: "Too many requests, please try again later."},
  });
  app.use(limiter);

  app.get("/", (req, res) => {
    res.send("app is running");
  });
  app.use("/auth", authController);
  app.use("/user", userController);
  app.use("/message", messageController);

  app.all("{/*dummy}", (req, res) =>
    res.status(400).json({ message: "in-valid app route" })
  );

  app.use(globalErrorHandling);
  return app.listen(port, () => {
    console.log("app is running");
  });
};

export default bootstrap;
