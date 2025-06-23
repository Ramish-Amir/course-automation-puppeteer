import fs from "fs";
import path from "path";

export const writeStudySessionToFile = async (filename, content) => {
  // Ensure the directory exists
  const dir = path.resolve(process.cwd(), "Files");
  filename = path.join(dir, path.basename(filename));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Append content to the file, create if it doesn't exist
  fs.appendFileSync(filename, content, "utf8");
};
