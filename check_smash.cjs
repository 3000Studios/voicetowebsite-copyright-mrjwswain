const fs = require("fs");
const path = require("path");

function findHtmlFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (
          file !== "dist" &&
          file !== "node_modules" &&
          file !== ".git" &&
          file !== ".vscode" &&
          file !== ".gemini"
        ) {
          findHtmlFiles(filePath, fileList);
        }
      } else {
        if (path.extname(file) === ".html") {
          fileList.push(filePath);
        }
      }
    });
  } catch (e) {
    // Ignore access errors
  }

  return fileList;
}

const rootDir = process.cwd();
const htmlFiles = findHtmlFiles(rootDir);
const filesToUpdate = [];

htmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  // Check for nav.js (either src="nav.js" or import ... form "nav.js")
  const hasNav = content.includes("nav.js");
  // Check for styles.css
  const hasStyles = content.includes("styles.css");

  if (!hasNav || !hasStyles) {
    filesToUpdate.push({
      file: file,
      missing_nav: !hasNav,
      missing_styles: !hasStyles,
    });
  }
});

console.log(JSON.stringify(filesToUpdate, null, 2));
