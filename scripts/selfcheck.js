const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "app.js",
  "package.json",
  ".env.example",
  path.join("config", "db.js"),
  path.join("db", "schema.sql"),
  path.join("db", "seed.sql")
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(__dirname, "..", file)));

if (missing.length > 0) {
  console.error("Faltan archivos:", missing.join(", "));
  process.exit(1);
}

console.log("Selfcheck OK: estructura base presente.");
