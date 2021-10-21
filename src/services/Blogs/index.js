import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { blogsValidationMiddleware } from "./validation.js";
import { getBlogs, writeBlogs, saveBlogsPictures } from "../../lib/fs-tools.js";

const blogsRouter = express.Router();

/* const blogsJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "posts.json"
);

const getBlogs = () => JSON.parse(fs.readFileSync(blogsJSONPath));
const writeBlogs = (content) =>
  fs.writeFileSync(blogsJSONPath, JSON.stringify(content)); */

blogsRouter.post("/", blogsValidationMiddleware, async (req, res, next) => {
  try {
    const errorsList = validationResult(req);
    if (!errorsList.isEmpty()) {
      next(createHttpError(400, { errorsList }));
    } else {
      const newBlog = { ...req.body, createdAt: new Date(), _id: uniqid() };
      const blogs = await getBlogs();
      blogs.push(newBlog);
      await writeBlogs(blogs);
      res.status(201).send({ id: newBlog.id });
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/", async (req, res, next) => {
  try {
    const errorsList = validationResult(req);
    if (!errorsList.isEmpty()) {
      next(createHttpError(404, { errorsList }));
    } else {
    console.log(req.body);
    const blogs = await getBlogs();
    console.log(blogs);
    if (req.query && req.query.title) {
      const filteredBlogs = blogs.filter(
        (blog) => blog.title === req.query.title
      );
      res.send(filteredBlogs);
    }
    res.send(blogs);
  }
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blogs = await getBlogs();

    /* const index = blogs.findIndex((b) => b._id === req.params.blogId);
    const blog = blogs[index]; */
    const blog = blogs.find((b) => b._id === req.params.blogId);
    /*    console.log(blogs[0]._id); */
    if (blog) {
      res.send(blog);
    } else {
      next(createHttpError(404, `Blog with id ${req.params.blogId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.put(
  "/:blogId",
  blogsValidationMiddleware,
  async (req, res, next) => {
    try {
      const errorsList = validationResult(req);
      if (!errorsList.isEmpty()) {
        next(createHttpError(400, { errorsList }));
      } else {
        const blogs = await getBooks();

        const index = blogs.findIndex((blog) => blog._id === req.params.blogId);

        const blogToModify = books[index];
        const updatedFields = req.body;

        const updatedBlog = { ...blogToModify, ...updatedFields };

        blogs[index] = updatedBlog;

        await writeBlogs(blogs);

        res.send(updatedBlog);
      }
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.delete("/:blogId", async (req, res, next) => {
  try {
    const blogs = await getBlogs();

    const remainingBlogs = blogs.filter(
      (blog) => blog.id !== req.params.blogId
    );

    await writeBlogs(remainingBlogs);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;
