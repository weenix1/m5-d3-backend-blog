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

/* export const savedBlogFolder = (filename) =>
  writeFile(join(publicFolderPath, filename)); */

/* export const uploadFile = (req, res, next) => {
  try {
    const { originalname, buffer } = req.file;
    const extension = extname(originalname);
    const fileName = `${req.params.id}${extension}`;
    const pathToFile = path.join(publicDirectory, fileName);
    fs.writeFileSync(pathToFile, buffer);
    const link = `http://localhost:3001/${fileName}`;
    req.file = link;
    next();
  } catch (error) {
    next(error);
  }
};
 */
