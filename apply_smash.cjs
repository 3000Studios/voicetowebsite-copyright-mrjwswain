const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();

function findHtmlFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file !== "dist" && file !== "node_modules" && file !== ".git" && file !== ".vscode" && file !== ".gemini") {
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

const htmlFiles = findHtmlFiles(rootDir);
let updatedCount = 0;

htmlFiles.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;

  // Calculate relative path to root
  const dir = path.dirname(file);
  let relPath = path.relative(dir, rootDir);
  if (relPath) {
    relPath += "/";
  } else {
    relPath = "";
  }
  // If we are in root, relPath is empty. If in subfolder, it's ../ or ../../
  // Windows path separator handling
  relPath = relPath.replace(/\\/g, "/");

  const styleTag = `<link rel="stylesheet" href="${relPath}styles.css" />`;
  const navTag = `<script type="module" src="${relPath}nav.js"></script>`;

  // 1. Inject styles.css if missing
  // We check for "styles.css" generally to avoid duplicates if they used absolute path or different rel path
  if (!content.includes("styles.css")) {
    if (content.includes("</head>")) {
      content = content.replace("</head>", `  ${styleTag}\n</head>`);
    } else if (content.includes("<body>")) {
      // Fallback if no head (unlikely but possible)
      content = content.replace("<body>", `<head>${styleTag}</head>\n<body>`);
    }
  }

  // 1a. Inject AdSense Auto-Ads (Global)
  if (!content.includes("adsbygoogle.js")) {
    const publisher = process.env.ADSENSE_PUBLISHER || "ca-pub-5800977493749262";
    const adScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}" crossorigin="anonymous"></script>`;
    if (content.includes("</head>")) {
      content = content.replace("</head>", `  ${adScript}\n</head>`);
    }
  }

  // 2. Inject nav.js if missing
  if (!content.includes("nav.js")) {
    if (content.includes("</body>")) {
      content = content.replace("</body>", `  ${navTag}\n</body>`);
    } else if (content.includes("</html>")) {
      content = content.replace("</html>", `  ${navTag}\n</html>`);
    } else {
      content += `\n${navTag}`;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated ${path.relative(rootDir, file)}`);
    updatedCount++;
  }
});

console.log(`Smash unification complete. Updated ${updatedCount} files.`);
