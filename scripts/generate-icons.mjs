import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const sourcePath = path.join(root, "public", "icon-source.svg");
const outputDir = path.join(root, "public");

const outputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

const svg = await readFile(sourcePath, "utf8");
const browser = await chromium.launch();

try {
  for (const output of outputs) {
    const page = await browser.newPage({
      viewport: { width: output.size, height: output.size },
      deviceScaleFactor: 1,
    });

    await page.setContent(
      `<!doctype html>
      <html>
        <body style="margin:0;background:transparent;overflow:hidden;width:${output.size}px;height:${output.size}px">
          <div style="width:${output.size}px;height:${output.size}px">
            ${svg}
          </div>
        </body>
      </html>`
    );

    await page.locator("svg").evaluate((element, size) => {
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      element.setAttribute("width", String(size));
      element.setAttribute("height", String(size));
      element.setAttribute("viewBox", "0 0 1024 1024");
    }, output.size);

    await page.screenshot({
      path: path.join(outputDir, output.file),
      omitBackground: false,
      clip: {
        x: 0,
        y: 0,
        width: output.size,
        height: output.size,
      },
    });

    await page.close();
  }
} finally {
  await browser.close();
}
