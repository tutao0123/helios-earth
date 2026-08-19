import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu"] });

async function shot(page, name, w, h) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3500);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage: false });
  const body = (await page.locator("body").innerText()).slice(0, 400);
  const canvas = await page.locator("canvas").count();
  console.log(JSON.stringify({ name, canvas, body: body.replace(/\s+/g, " ").trim().slice(0, 220), errors }, null, 2));
  return page;
}

const page = await browser.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: "/workspace/screenshots/helios-desktop.png" });
// click a lab if present
const lab = page.getByRole("button", { name: /深度求索|DeepSeek|Anthropic/ }).first();
if (await lab.count()) {
  await lab.click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "/workspace/screenshots/helios-lab.png" });
}
const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("DESKTOP", { canvas: await page.locator("canvas").count(), body: body.slice(0, 280), pageErrors, consoleErrors });

const mobile = await browser.newPage();
const mErr = [];
mobile.on("pageerror", (e) => mErr.push(String(e)));
mobile.on("console", (m) => { if (m.type() === "error") mErr.push(m.text()); });
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await mobile.waitForTimeout(3500);
await mobile.screenshot({ path: "/workspace/screenshots/helios-mobile.png" });
const mb = (await mobile.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("MOBILE", { canvas: await mobile.locator("canvas").count(), body: mb.slice(0, 220), errors: mErr, overflow: await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2) });

await browser.close();
