import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { readJSON, writeJSON, writeFile } = fs;

const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data");
const publicFolderPath = join(process.cwd(), "./public/img/blogs");

const blogsJSONPath = join(dataFolderPath, "posts.json");

export const getBlogs = () => readJSON(blogsJSONPath);
export const writeBlogs = (content) => writeJSON(blogsJSONPath, content);

export const saveBlogsPictures = (filename, contentAsButter) =>
  writeFile(join(publicFolderPath, filename), contentAsButter);
