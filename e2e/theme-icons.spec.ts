import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? "http://127.0.0.1:4175";

test.describe("icon configuration integration", () => {
  test.skip(process.env.COMPOSE_E2E !== "1", "requires the canonical Compose stack");

  test("changes the real preview pack and semantic override immediately", async ({ page }) => {
    await page.goto(composeBaseUrl);
    await page.getByRole("button", { name: "Icons" }).click();
    const preview = page.frameLocator('iframe[title="Filament preview"]');
    const firstIcon = preview.locator("svg").first();
    await expect(firstIcon).toHaveAttribute("data-ftb-icon-pack", "default");
    const defaultPath = await firstIcon.locator("path").getAttribute("d");

    await page.getByLabel("Icon pack").selectOption("solid");
    await expect(firstIcon).toHaveAttribute("data-ftb-icon-pack", "solid");

    await page.getByLabel("Products semantic icon override").selectOption("heroicon-o-cube");
    await expect(firstIcon).toHaveAttribute("data-ftb-icon", "heroicon-o-cube");
    await expect(firstIcon.locator("path")).not.toHaveAttribute("d", defaultPath!);

    await page.getByRole("button", { name: "Reset products semantic icon" }).click();
    await expect(firstIcon).toHaveAttribute("data-ftb-icon", "heroicon-s-shopping-bag");
  });

  test("persists icon state and exports JSON plus PanelProvider PHP", async ({ page }) => {
    await page.goto(composeBaseUrl);
    await page.getByRole("button", { name: "Icons" }).click();
    await page.getByLabel("Icon pack").selectOption("mini");
    await page.getByLabel("Orders semantic icon override").selectOption("heroicon-m-cube");

    await expect.poll(() => page.evaluate(() => {
      const raw = localStorage.getItem("ftb-theme");
      return raw ? JSON.parse(raw).icons : null;
    })).toEqual({
      pack: "mini",
      overrides: { orders: "heroicon-m-cube" },
    });
    await page.reload();
    await page.getByRole("button", { name: "Icons" }).click();
    await expect(page.getByLabel("Icon pack")).toHaveValue("mini");
    await expect(page.getByLabel("Orders semantic icon override")).toHaveValue("heroicon-m-cube");

    const jsonDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export theme JSON" }).click();
    expect(JSON.parse(await readFile((await (await jsonDownload).path())!, "utf8")).icons.pack).toBe("mini");

    const phpDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export PanelProvider icon config" }).click();
    const php = await readFile((await (await phpDownload).path())!, "utf8");
    expect(php).toContain("heroicon-m-cube");
    expect(php).toContain("->icons([");
  });
});
