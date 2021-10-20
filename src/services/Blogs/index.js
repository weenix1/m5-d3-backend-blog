import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { blogsValidationMiddleware } from "./validation.js";

const blogsRouter = express.Router();

const blogsJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "posts.json"
);

const getBlogs = () => JSON.parse(fs.readFileSync(blogsJSONPath));
const writeBlogs = (content) =>
  fs.writeFileSync(blogsJSONPath, JSON.stringify(content));

blogsRouter.post("/", (req, res, next) => {
  try {
    const errorsList = validationResult(req);
    if (!errorsList.isEmpty()) {
      next(createHttpError(400, { errorsList }));
    } else {
      const newBlog = { ...req.body, createdAt: new Date(), id: uniqid() };
      const blogs = getBlogs();
      blogs.push(newBlog);
      writeBlogs(blogs);
      res.status(201).send({ id: newBlog.id });
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/", (req, res, next) => {
  try {
    console.log(req.body);
    const blogs = getBlogs();
    res.send(blogs);
  } catch (error) {
    next(error);
  }
});
blogsRouter.get("/:blogId", (req, res, next) => {
  try {
    const blogs = getBlogs();

    const index = blogs.findIndex((b) => b._id === req.params.blogId);
    const blog = blogs[index];
    /*   const blog = blogs.find((b) => b._id === req.params.blogId); */
    console.log(blogs[0]._id);
    if (blog) {
      res.send(blog);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.put("/:blogId", (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});
blogsRouter.delete("/:blogId", (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;
