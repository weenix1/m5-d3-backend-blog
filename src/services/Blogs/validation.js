import { body } from "express-validator";

export const blogsValidationMiddleware = [
  body("title").exists().withMessage("Title is required field!"),
  body("category").exists().withMessage("Category is required!"),
  body("name").exists().withMessage("Authors name is required!"),
];
