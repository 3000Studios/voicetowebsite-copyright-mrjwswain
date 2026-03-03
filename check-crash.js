import fs from "fs";

// Check JSON files
const jsonFiles = [
  "package.json",
  "wrangler.toml",
  "src/site-config.json",
  "tsconfig.json",
  "vite.config.js",
  "vitest.config.ts",
];

console.log("Checking configuration files...");

jsonFiles.forEach((file) => {
  try {
    if (file.endsWith(".json")) {
      const content = fs.readFileSync(file, "utf8");
      JSON.parse(content);
      console.log(`✓ ${file} - Valid JSON`);
    } else if (file.endsWith(".toml")) {
      const content = fs.readFileSync(file, "utf8");
      // Basic TOML validation - check for balanced brackets
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;
      if (openBrackets === closeBrackets) {
        console.log(`✓ ${file} - Valid TOML structure`);
      } else {
        console.log(`✗ ${file} - Invalid TOML brackets`);
      }
    } else {
      console.log(`? ${file} - Not JSON/TOML`);
    }
  } catch (error) {
    console.log(`✗ ${file} - Error: ${error.message}`);
  }
});

// Check for circular dependencies
console.log("\nChecking for potential issues...");

// Check app.js for potential infinite loops
const appJs = fs.readFileSync("app.js", "utf8");
const whileLoops = (appJs.match(/while\s*\(/g) || []).length;
const forLoops = (appJs.match(/for\s*\(/g) || []).length;
console.log(
  `Found ${whileLoops} while loops and ${forLoops} for loops in app.js`
);

// Check for very large files
const stats = fs.statSync("app.js");
const fileSizeKB = stats.size / 1024;
console.log(`app.js size: ${fileSizeKB.toFixed(2)} KB`);

if (fileSizeKB > 100) {
  console.log("⚠️  app.js is large - consider splitting");
}

console.log("\nCheck complete!");
