import { expect, test } from "@playwright/test";

const demoBaseUrl =
  process.env.COMPOSE_E2E === "1"
    ? (process.env.COMPOSE_BASE_URL ?? "http://127.0.0.1:4175")
    : "http://127.0.0.1:4174";

test("validated foundation projection updates the preview immediately without reload or network mutation", async ({
  page,
}) => {
  const requests: string[] = [];
  const mutationUrls: string[] = [];
  const requestsAfterProjection: Array<{ method: string; url: string }> = [];
  let projectionSent = false;
  let navigationRequests = 0;
  page.on("request", (request) => {
    requests.push(request.method());
    if (request.method() !== "GET") mutationUrls.push(request.url());
    if (projectionSent)
      requestsAfterProjection.push({
        method: request.method(),
        url: request.url(),
      });
    if (request.isNavigationRequest() && request.url().includes("/demo/admin"))
      navigationRequests += 1;
  });

  await page.goto(`${demoBaseUrl}/demo/admin`);
  requests.length = 0;
  navigationRequests = 0;
  const baselineMutationUrls = new Set(mutationUrls);
  projectionSent = true;
  const accepted = await page.evaluate(() => {
    document.body.dataset.foundationEvents = "0";
    window.addEventListener("ftb:theme:updated", () => {
      document.body.dataset.foundationEvents = String(
        Number(document.body.dataset.foundationEvents) + 1,
      );
    });

    window.postMessage(
      {
        type: "ftb:theme:update",
        schemaVersion: 1,
        theme: {
          schemaVersion: 3,
          colors: { primary: "#0f766e" },
          foundations: {},
          overrides: [],
          customCss: "",
        },
        projection: {
          schemaVersion: 1,
          compatibility: "filament-5.9",
          mode: "light",
          mappings: [
            {
              id: "palette.primary.base",
              mapping: "preview-emulatable",
              variable: "--ftb-primary",
              value: "#0f766e",
            },
          ],
        },
      },
      "*",
    );

    return true;
  });

  expect(accepted).toBe(true);
  await expect.poll(() => page.locator("#ftb-managed-theme").count()).toBe(1);
  await expect
    .poll(() =>
      page
        .locator("html")
        .evaluate((element) =>
          getComputedStyle(element).getPropertyValue("--ftb-primary").trim(),
        ),
    )
    .toBe("#0f766e");
  await expect
    .poll(() => page.locator("body").getAttribute("data-foundation-events"))
    .toBe("1");
  expect(navigationRequests).toBe(0);
  expect(
    requestsAfterProjection
      .filter(({ method }) => method !== "GET")
      .map(({ url }) => url)
      .filter(
        (url) => !baselineMutationUrls.has(url) && !url.includes("/livewire-"),
      ),
  ).toEqual([]);
});

test("unmapped foundation projection reports compatibility instead of emitting guessed CSS", async ({
  page,
}) => {
  await page.goto(`${demoBaseUrl}/demo/admin`);
  await page.evaluate(() => {
    document.body.dataset.compatibilityNotice = "";
    window.addEventListener("ftb:preview-compatibility", (event) => {
      document.body.dataset.compatibilityNotice = JSON.stringify(
        (event as CustomEvent).detail,
      );
    });
    window.postMessage(
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
          mode: "light",
          mappings: [
            { id: "surface.page", mapping: "unmapped", value: "#ffffff" },
          ],
        },
      },
      "*",
    );
  });

  await expect
    .poll(() => page.locator("body").getAttribute("data-compatibility-notice"))
    .toContain("surface.page");
  expect(await page.locator("#ftb-managed-theme").count()).toBe(0);
});
