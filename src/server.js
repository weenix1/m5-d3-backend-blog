import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import {
  genericErrorHandler,
  badRequestHandler,
  unauthorizedHandler,
  notFoundHandler,
} from "./errorsHandler.js";
import blogsRouter from "./services/Blogs/index.js";

const server = express();

server.use(express.json());
server.use(cors());

server.use("/blogs", blogsRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

const port = 3001;
console.table(listEndpoints(server));

server.listen(port, () => {
  console.log("server running on port:", port);
});
