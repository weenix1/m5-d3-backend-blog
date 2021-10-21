import { body } from "express-validator";

export const blogsValidationMiddleware = [
  body("title").exists().withMessage("Title is required field!"),
  body("category").exists().withMessage("Category is required!"),
  body("author.name").exists().withMessage("authors name  is required!"),
];
