import { expect, test } from "@playwright/test";

const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? "http://127.0.0.1:4175";

test.describe("foundation preview integration", () => {
  test.skip(
    process.env.COMPOSE_E2E !== "1",
    "requires the canonical Compose stack",
  );

  test("edits a real builder foundation control and updates the actual preview iframe immediately", async ({
    page,
  }) => {
    const navigationRequests: string[] = [];
    const mutationRequests: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest()) navigationRequests.push(request.url());
      if (request.method() !== "GET") mutationRequests.push(request.url());
    });

    await page.goto(composeBaseUrl);
    const preview = page.frameLocator('iframe[title="Filament preview"]');
    await expect(
      page.getByRole("heading", { name: "Filament Theme Builder" }),
    ).toBeVisible();
    await expect(page.getByLabel("Primary color")).toBeVisible();
    await expect(
      preview.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();

    const iframe = page.locator('iframe[title="Filament preview"]');
    const iframeUrl = await iframe.getAttribute("src");
    expect(new URL(iframeUrl!, page.url()).pathname).toBe("/demo/admin");
    expect(new URL(iframeUrl!, page.url()).origin).toBe(
      new URL(composeBaseUrl).origin,
    );

    const previewFrame = page.frame({ url: /\/demo\/admin/ });
    expect(previewFrame).toBeTruthy();
    await previewFrame!.evaluate(() => {
      document.body.dataset.foundationEvents = "0";
      window.addEventListener("ftb:theme:updated", () => {
        document.body.dataset.foundationEvents = String(
          Number(document.body.dataset.foundationEvents) + 1,
        );
      });
    });

    navigationRequests.length = 0;
    mutationRequests.length = 0;
    await page.getByLabel("Primary color").fill("#0f766e");

    await expect
      .poll(() =>
        previewFrame!.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--ftb-primary")
            .trim(),
        ),
      )
      .toBe("#0f766e");
    await expect
      .poll(() => previewFrame!.locator("#ftb-managed-theme").count())
      .toBe(1);
    await expect
      .poll(() =>
        previewFrame!.evaluate(() =>
          Number(document.body.dataset.foundationEvents),
        ),
      )
      .toBe(1);

    expect(navigationRequests).toEqual([]);
    expect(mutationRequests).toEqual([]);
  });

  test("rejects forged inventory tuples and reports unmapped mode compatibility in the actual iframe", async ({
    page,
  }) => {
    await page.goto(composeBaseUrl);
    const iframe = page.locator('iframe[title="Filament preview"]');
    await expect(page.getByLabel("Primary color")).toBeVisible();
    await expect(
      page
        .frameLocator('iframe[title="Filament preview"]')
        .getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();

    const previewFrame = page.frame({ url: /\/demo\/admin/ });
    expect(previewFrame).toBeTruthy();
    await previewFrame!.evaluate(() => {
      document.getElementById("ftb-managed-theme")?.remove();
      document.body.dataset.acceptedMessages = "0";
      document.body.dataset.compatibilityNotice = "";
      window.addEventListener("ftb:preview-message-accepted", () => {
        document.body.dataset.acceptedMessages = String(
          Number(document.body.dataset.acceptedMessages) + 1,
        );
      });
      window.addEventListener("ftb:preview-compatibility", (event) => {
        document.body.dataset.compatibilityNotice = JSON.stringify(
          (event as CustomEvent).detail,
        );
      });
    });

    const iframeUrl = await iframe.getAttribute("src");
    const targetOrigin = new URL(iframeUrl!, page.url()).origin;
    const message = (
      mapping: Record<string, unknown>,
      mode: "light" | "dark",
    ) =>
      page.evaluate(
        ({ mapping, mode, targetOrigin }) => {
          const target = document.querySelector<HTMLIFrameElement>(
            'iframe[title="Filament preview"]',
          )!.contentWindow!;
          target.postMessage(
            {
              type: "ftb:theme:update",
              schemaVersion: 1,
              theme: {
                schemaVersion: 3,
                colors: { primary: "#6366f1" },
                foundations: {},
                overrides: [],
                customCss: "",
              },
              projection: {
                schemaVersion: 1,
                compatibility: "filament-5.9",
                mode,
                mappings: [mapping],
              },
            },
            targetOrigin,
          );
        },
        { mapping, mode, targetOrigin },
      );

    await message(
      {
        id: "palette.primary.base",
        mapping: "preview-emulatable",
        variable: "--primary-500",
        value: "#0f766e",
      },
      "light",
    );
    await expect
      .poll(() =>
        previewFrame!.evaluate(() =>
          Number(document.body.dataset.acceptedMessages),
        ),
      )
      .toBe(0);
    expect(await previewFrame!.locator("#ftb-managed-theme").count()).toBe(0);

    await message(
      { id: "density", mapping: "unmapped", value: "compact" },
      "dark",
    );
    await expect
      .poll(() =>
        previewFrame!.evaluate(() => document.body.dataset.compatibilityNotice),
      )
      .toContain("density");
    expect(
      await previewFrame!.evaluate(
        () => JSON.parse(document.body.dataset.compatibilityNotice!).mode,
      ),
    ).toBe("dark");
    expect(await previewFrame!.locator("#ftb-managed-theme").count()).toBe(0);
  });
});
