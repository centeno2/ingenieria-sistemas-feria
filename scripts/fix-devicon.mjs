import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../node_modules/devicon/devicon.min.css", import.meta.url);
try {
  let css = await readFile(path, "utf8");
  if (css.charCodeAt(0) === 0xfeff) {
    css = css.slice(1);
    await writeFile(path, css, "utf8");
    console.log("✓ Devicon CSS preparado para Turbopack");
  }
} catch (error) {
  console.warn("Devicon postinstall:", error?.message ?? error);
}
