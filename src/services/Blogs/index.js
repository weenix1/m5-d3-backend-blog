import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
/* import fs from "fs"; */
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { validationResult } from "express-validator";
import { blogsValidationMiddleware } from "./validation.js";
import {
  getBlogs,
  writeBlogs,
  saveBlogsPictures,
  /* savedBlogFolder, */
} from "../../lib/fs-tools.js";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
/* import { saveBlogsPictures } from "../../lib/fs-tools.js"; */

const blogsRouter = express.Router();

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "weenix-blogs",
  },
});

/* const blogsJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "posts.json"
);

const getBlogs = () => JSON.parse(fs.readFileSync(blogsJSONPath));
const writeBlogs = (content) =>
  fs.writeFileSync(blogsJSONPath, JSON.stringify(content)); */

blogsRouter.post(
  "/multipleUpload",
  multer().array("picture"),
  blogsValidationMiddleware,
  async (req, res, next) => {
    try {
      const errorsList = validationResult(req);
      if (!errorsList.isEmpty()) {
        next(createHttpError(400, { errorsList }));
      } else {
        const newBlog = { ...req.body, createdAt: new Date(), _id: uniqid() };
        const blogs = await getBlogs();
        blogs.push(newBlog);
        const arrayOfPromises = req.files.map((file) =>
          saveBlogsPictures(file.originalname, file.buffer)
        );
        await Promise.all(arrayOfPromises);
        await writeBlogs(blogs);

        res.status(201).send({ id: newBlog.id });
      }
    } catch (error) {
      next(error);
    }
  }
);

/* blogsRouter.post("/:blogId/comment", async (req, res, next) => {
  try {
    const { text, userName } = req.body;

    const comment = { id: uniqid(), text, userName };

    const newComment = {
      ...req.body,
      comments: comment,
      createdAt: new Date(),
      _id: req.params.blogId,
    };
    const blogs = await getBlogs();
    blogs.push(newComment);

    await writeBlogs(blogs);
    res.status(201).send({ id: newComment._id });
  } catch (error) {
    next(error);
  }
}); */

blogsRouter.post(
  "/uploadSingle",
  multer().single("picture"),
  // blogsValidationMiddleware,
  async (req, res, next) => {
    try {
      console.log("REQ FILE ", req.file);
      //console.log(req);

      const pictureUrl = `http://localhost:3001/img/blogs/${req.file.originalname}`;
      const newBlog = {
        ...req.body,
        cover: pictureUrl,
        author: {},
        comments: [],
        createdAt: new Date(),
        _id: uniqid(),
      };
      const blogs = await getBlogs();
      blogs.push(newBlog);
      await saveBlogsPictures(req.file.originalname, req.file.buffer);
      console.log(saveBlogsPictures);
      await writeBlogs(blogs);
      res.status(201).send(newBlog /* { id: newBlog._id } */);
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.post(
  "/uploadCloudinary",
  multer({ storage: cloudinaryStorage }).single("picture"),
  async (req, res, next) => {
    try {
      console.log("REQ FILE ", req.file);
      //console.log(req);

      const pictureUrl = `http://localhost:3001/img/blogs/${req.file.originalname}`;
      const newBlog = {
        ...req.body,
        cover: pictureUrl,
        /*   author: {},
        comments: [], */
        createdAt: new Date(),
        _id: uniqid(),
      };
      const blogs = await getBlogs();
      blogs.push(newBlog);
      /*   await saveBlogsPictures(req.file.originalname, req.file.buffer);
      console.log(saveBlogsPictures); */
      await writeBlogs(blogs);
      res.status(201).send(newBlog /* { id: newBlog._id } */);
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.post(
  "/",
  multer().single("picture"),
  /*  blogsValidationMiddleware, */
  async (req, res, next) => {
    try {
      const { name, avatar } = req.body;

      const author = { name, avatar };

      console.log(req.file);
      const errorsList = validationResult(req);
      if (!errorsList.isEmpty()) {
        next(createHttpError(400, { errorsList }));
      } else {
        const newBlog = {
          /*  ...req.body, */
          author,
          comments: [],
          createdAt: new Date(),
          _id: uniqid(),
        };
        const blogs = await getBlogs();
        blogs.push(newBlog);

        await writeBlogs(blogs);
        res.status(201).send({ id: newBlog._id });
      }
    } catch (error) {
      next(error);
    }
  }
);

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
        const blogs = await getBlogs();

        const index = blogs.findIndex((blog) => blog._id === req.params.blogId);

        const blogToModify = blogs[index];
        const updatedFields = req.body;

        const updatedBlog = {
          ...blogToModify,
          ...updatedFields,
          updatedAt: new Date(),
          _id: req.params.blogId,
        };

        blogs[index] = updatedBlog;

        await writeBlogs(blogs);

        res.send(updatedBlog);
      }
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.put(
  "/:blogId/cover",
  multer().single("picture"),
  async (req, res, next) => {
    try {
      const blogs = await getBlogs();

      const index = blogs.findIndex((blog) => blog._id === req.params.blogId);

      const blogToModify = blogs[index];
      /* const updatedFields = req.body; */
      console.log("REQ FILE: ", req.file);
      const extension = path.extname(req.file.originalname);

      const imageUrl = `http://localhost:3001/img/blogs/${req.params.blogId}${extension}`;

      const updatedBlog = {
        ...blogToModify,
        category: "",
        title: "",
        content: "",
        cover: imageUrl,
        updatedAt: new Date(),
        _id: req.params.blogId,
      };

      blogs[index] = updatedBlog;
      await saveBlogsPictures(req.params.blogId + extension, req.file.buffer);
      await writeBlogs(blogs);

      res.send(updatedBlog);
    } catch (error) {
      /* next(error); */

      console.log(error);
      res.status(404).send({ message: error.message });
    }
  }
);

blogsRouter.post("/:blogId/comments", async (req, res, next) => {
  try {
    const { text, userName } = req.body;

    const comment = {
      ...req.body,
      _id: uniqid(),
      text,
      userName,
      createdAt: new Date(),
    };

    const blogs = await getBlogs();

    const index = blogs.findIndex((blog) => blog._id === req.params.blogId);

    blogs[index].comments = blogs[index].comments || [];

    const blogToModify = blogs[index];

    blogToModify.comments.push(comment);

    blogs[index] = blogToModify;

    await writeBlogs(blogs);

    res.send(comment);
  } catch (error) {
    next(error);
  }
});

/* blogsRouter.post(
  "/:blogId/comments",

  async (req, res, next) => {
    try {
      const { text, userName } = req.body;

      const comment = { id: uniqid(), text, userName, createdAt: new Date() };

      const blogs = await db.getBlogs();

      const index = blogs.findIndex((b) => b.id === req.params.blogId);

      blogs[index].comments = blogs[index].comments || [];

      const editedPost = blogs[index];
      editedPost.comments.push(comment);

      blogs[index] = editedPost;

      await db.writeBlogs(blogs);
      res.send(editedPost);
    } catch (error) {
      next(error);
    }
  }
); */

blogsRouter.put("/:blogId/comment", async (req, res, next) => {
  try {
    const { text, userName } = req.body;

    const comment = { id: uniqid(), text, userName, createdAt: new Date() };

    const blogs = await getBlogs();

    const index = blogs.findIndex((blog) => blog._id === req.params.blogId);

    blogs[index].comments = blogs[index].comments || [];

    const blogToModify = blogs[index];

    blogToModify.comments.push(comment);

    blogs[index] = blogToModify;

    await writeBlogs(blogs);

    res.send(comment);
  } catch (error) {
    next(error);
  }
});

/* blogsRouter.put("/:blogId/author", async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const author = { name, avatar };

    const blogs = await getBlogs();

    const index = blogs.findIndex((blog) => blog._id === req.params.blogId);

    const newAuthor = {
      ...req.body,
      author,
    };

    blogs[index] = newAuthor;

    await writeBlogs(blogs);

    res.send(newAuthor);
  } catch (error) {
    next(error);
  }
}); */

blogsRouter.delete("/:blogId", async (req, res, next) => {
  try {
    const blogs = await getBlogs();
    /* const blog = blogs.find((blog) => blog._id === req.params.blogId);
    if (blog) { */
    const remainingBlogs = blogs.filter(
      (blog) => blog._id !== req.params.blogId
    );
    /*   await saveBlogsPictures(req.file.originalname, req.file.buffer);
      await fs.unlink(saveBlogsPictures); */
    await writeBlogs(remainingBlogs);
    /* } else */ res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;

/* blogPostRouter.post(
  "/:blogId/uploadSingle",
  multer().single("picture"),

  async (req, res, next) => {
    try {
      console.log(req.file);
      const errorList = validationResult(req);

      const posts = await getBlogs();

      const post = posts.find((p) => p.id === req.params.blogId);
      if (post && req.file) {
        const extention = path.extname(req.file.originalname);

        await savePostImg(req.params.blogId + extention, req.file.buffer);

        const coverUrl = http://localhost:3001/img/post/$%7Breq.params.blogId%7D$%7Bextention%7D%60;

        post.cover = coverUrl;
        const postsArray = posts.filter((p) => p.id !== req.params.blogId);

        postsArray.push(post);

        await writeBlogs(postsArray);

        res.status(200).send("post success ");
      } else {
        next(createHttpError(400, { errorList }));
      }
    } catch (error) {
      next(error);
    }
  }
); */

/* blogPostRouter.put(
  "/:blogId/comment",

  async (req, res, next) => {
    try {
      const { text, userName } = req.body;

      const comment = { id: uniqid(), text, userName, createdAt: new Date() };

      const blogs = await getBlogs();

      const index = blogs.findIndex((blog) => blog.id === req.params.blogId);

      blogs[index].comments = blogs[index].comments || [];
      const editedPost = {
        ...blogs[index],
        ...req.body,
        comments: [...blogs[index].comments, comment],
        // updatedAt: new Date(),
        id: req.params.blogId,
      };
      blogs[index] = editedPost;

      await writeBlogs(blogs);
      res.send(editedPost);
    } catch (error) {
      next(error);
    }
  }
); */
