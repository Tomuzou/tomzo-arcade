import { test, expect } from "@playwright/test";

const ROOT = "/tomzo-arcade/free-kick/";

test.beforeEach(() => {
  test.skip(!process.env.ARCHIVE_CHECK, "Requires a production build and preview server.");
});

test("latest and every frozen version load their 3D game", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const dir of ["", "ver.4.0.c/", "ver.3.1.g/", "ver.3.0.c/", "ver.2.0.c/", "ver.1.0.c/"]) {
    const response = await page.goto(`${ROOT}${dir}`);
    expect(response?.status(), `HTTP response for ${dir || "latest"}`).toBe(200);
    await expect(page.locator("#root canvas")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("latest links to the arcade and to every frozen version", async ({ page }) => {
  await page.goto(ROOT);
  await expect(page.getByText("ver.4.1.c · Claude Code")).toBeVisible();
  await expect(page.getByRole("link", { name: "← ARCADE" })).toHaveAttribute("href", "/tomzo-arcade/");
  for (const dir of ["ver.4.0.c", "ver.3.1.g", "ver.3.0.c", "ver.2.0.c", "ver.1.0.c"])
    await expect(page.getByRole("link", { name: new RegExp(`^${dir.replaceAll(".", "\\.")}`) })).toHaveAttribute("href", `${ROOT}${dir}/`);
  await page.getByRole("link", { name: /^ver\.4\.0\.c/ }).click();
  await expect(page.getByText("ver.4.0.c · Claude Code")).toBeVisible();
  await page.getByRole("link", { name: /^最新版/ }).click();
  await expect(page).toHaveURL(new RegExp(`${ROOT}$`));
});

test("old version names redirect to the renamed versions", async ({ page }) => {
  for (const [from, to] of [
    ["ver.c.1", "ver.1.0.c"],
    ["v2", "ver.2.0.c"],
    ["ver.c.3/v1", "ver.1.0.c"],
    ["ver.c.4", "ver.4.0.c"],
    ["ver.g.1", "ver.3.1.g"],
  ]) {
    await page.goto(`${ROOT}${from}/`);
    await expect(page).toHaveURL(`${ROOT}${to}/`);
  }
});
