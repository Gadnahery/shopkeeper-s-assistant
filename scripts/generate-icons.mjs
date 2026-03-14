import { chromium } from "playwright";
import path from "node:path";
import { readFile } from "node:fs/promises";

const root = process.cwd();
const source = await readFile(path.join(root, "public", "icon-source.svg"), "utf8");

const outputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

const browser = await chromium.launch();

try {
  for (const output of outputs) {
    const page = await browser.newPage({
      viewport: { width: output.size, height: output.size },
      deviceScaleFactor: 1,
    });

    await page.setContent(
      `<!doctype html><html><body style="margin:0;width:${output.size}px;height:${output.size}px;overflow:hidden;background:transparent">${source}</body></html>`
    );

    await page.locator("svg").evaluate((node, size) => {
      node.setAttribute("width", String(size));
      node.setAttribute("height", String(size));
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      node.style.display = "block";
    }, output.size);

    await page.screenshot({
      path: path.join(root, "public", output.file),
      clip: { x: 0, y: 0, width: output.size, height: output.size },
      omitBackground: false,
    });

    await page.close();
  }
} finally {
  await browser.close();
}
