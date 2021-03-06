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
  getBlogsReadableStream,
  /* savedBlogFolder, */
} from "../../lib/fs-tools.js";
import {
  sendRegistrationEmail,
  sendRegistrationEmailAttach,
} from "../../lib/emails-tools.js";
import { pipeline } from "stream";
import { createGzip } from "zlib";
import json2csv from "json2csv";
import { getPDFReadableStream, generatePDFAsync } from "../../lib/pdf-tools.js";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

import mine from "mime";

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

blogsRouter.get("/PDFAsync", async (req, res, next) => {
  try {
    // 1. Generate the PDF (with pdfmake)
    const path = await generatePDFAsync({});
    // 2. Do stuff with the generated PDF (example --> send it as an attachment to email)

    res.send(path);
  } catch (error) {
    next(error);
  }
});

blogsRouter.post("/register", async (req, res, next) => {
  try {
    // 1. Receive email address via req.body
    const { email } = req.body;

    // 2. Send email on that address
    await sendRegistrationEmail(email);

    // 3. Send ok
    res.send("ok");
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/downloadJSON", async (req, res, next) => {
  try {
    // SOURCE (file on disk, request, ....) --> DESTINATION (file on disk, terminal, response...)

    // In this example we are going to have: SOURCE (file on disk --> books.json) --> DESTINATION (response)

    res.setHeader("Content-Disposition", "attachment; filename=posts.json.gz"); // This header tells the browser to do not open the file, but to download it

    const source = getBlogsReadableStream();
    const transform = createGzip();
    const destination = res;

    pipeline(source, transform, destination, (err) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/downloadCSV", (req, res, next) => {
  try {
    res.setHeader("Content-Disposition", "attachment; filename=blogs.csv");
    const source = getBlogsReadableStream();
    const transform = new json2csv.Transform({
      fields: ["_id", "title", "category"],
    });
    const destination = res;

    pipeline(source, transform, destination, (err) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
});

blogsRouter.get("/:blogId/downloadPDF", async (req, res, next) => {
  try {
    const blogs = await getBlogs();

    const blog = blogs.find((b) => b._id === req.params.blogId);

    res.setHeader("Content-Disposition", "attachment; filename=blogPost.pdf"); // This header tells the browser to do not open the file, but to download it

    const source = await getPDFReadableStream(blog); // PDF READABLE STREAM
    const destination = res;

    pipeline(source, destination, (err) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
});

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

      const pictureUrl = req.file.path;
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
      /*  await saveBlogsPictures(req.file.originalname, req.file.buffer);
      console.log(saveBlogsPictures); */
      await writeBlogs(blogs);
      const path = await generatePDFAsync(newBlog);
      console.log(path);

      const attachment = fs.readFileSync(path).toString("base64");

      await sendRegistrationEmail(
        "ogalamartha@gmail.com",
        attachment,
        newBlog.title
      );

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

      const pictureUrl = req.file.path;
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

      await writeBlogs(blogs);
      const path = await generatePDFAsync(newBlog);
      console.log("here is path", path);

      const attachment = fs.readFileSync(path).toString("base64");

      await sendRegistrationEmailAttach(
        "ogalamartha@gmail.com",
        attachment,
        newBlog.title
      );

      res.status(201).send(newBlog /* { id: newBlog._id } */);
    } catch (error) {
      next(error);
    }
  }
);

blogsRouter.put(
  "/:blogId/uploadCloudinary",
  multer({ storage: cloudinaryStorage }).single("picture"),
  async (req, res, next) => {
    try {
      console.log("REQ FILE ", req.file);

      const blogs = await getBlogs();

      const index = blogs.findIndex((blog) => blog._id === req.params.blogId);
      //console.log(req);
      const blogToModify = blogs[index];
      const updatedFields = req.body;

      const pictureUrl = req.file.path;
      const updatedBlog = {
        ...blogToModify,
        ...updatedFields,
        cover: pictureUrl,

        createdAt: new Date(),
        _id: req.params.blogId,
      };

      blogs[index] = updatedBlog;

      /*   await saveBlogsPictures(req.file.originalname, req.file.buffer);
      console.log(saveBlogsPictures); */
      await writeBlogs(blogs);
      res.status(201).send(updatedBlog /* { id: newBlog._id } */);
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
