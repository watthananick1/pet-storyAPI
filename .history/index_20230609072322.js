import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";
// import firebase from "firebase-admin";
// import "firebase/auth";
// import "firebase/firestore";
// import "firebase/storage";
import dotenv from "dotenv";
import winston from "winston";
import bodyParser from 'body-parser';
import socketio from "socket.io";

// import { db, storage } from "../../models/firebase.js";

import usersRouter from "../api/routes/users.js";
import authRoute from "../api/routes/auth.js";
import postRoute from "../api/routes/posts.js";
import commentRoute from "../api/routes/comments.js";
import typePetRoute from "../api/routes/typePets.js";
import searchRoute from "../api/routes/search.js";
import reportRoute from "../api/routes/report.js";

import validateToken from './models/authMiddleware.js';

const app = express();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();


app.use("/images", express.static(new URL("./public/images", import.meta.url).pathname));

app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json({limit: '1000mb'}));

app.use(function(req, res, next) {
  var oneof = false;
  if(req.headers.origin) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      oneof = true;
  }
  if(req.headers['access-control-request-method']) {
      res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
      oneof = true;
  }
  if(req.headers['access-control-request-headers']) {
      res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
      oneof = true;
  }
  if(oneof) {
      res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
  }

  // intercept OPTIONS method
  if (oneof && req.method == 'OPTIONS') {
      res.send(200);
  } else {
      next();
  }
});

app.get('/api/protected', validateToken, (req, res) => {
  // Access the user's information from req.user
  const userId = req.user.userId;
  console.log(`Accessing ${userId}`);
  // Handle the protected route logic here
  res.status(200).json({ userId });
  res.send(`Protected route accessed by user with ID: ${userId}`);
});

app.use("/api/auth", authRoute);
app.use("/api/users", usersRouter);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);
app.use("/api/typePets", typePetRoute);
app.use("/api/search", searchRoute);
app.use("/api/report", reportRoute);

app.use("*", (request, response, next) => {
  logger.warn(`Undefined route: ${request.originalUrl}`);
  next();   
});

const server = app.listen(4000, () => {
  console.log("Backend server is running!");
});

const io = socketio()
