import { cp, mkdir, rm } from "node:fs/promises";

const files = ["index.html", "styles.css", "script.js", "form-validation.js", "site-config.js"];
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all(files.map(file => cp(file, `dist/${file}`)));
await cp("assets", "dist/assets", { recursive: true });
console.log(`Built ${files.length} site files and assets into dist/`);
