import { expect, test } from "@playwright/test";

const composeBaseUrl = process.env.COMPOSE_BASE_URL ?? "http://127.0.0.1:4175";
const foundationShades = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [shade, "#6366f1"]),
);
const validFoundations = {
  palettes: Object.fromEntries(
    ["primary", "success", "warning", "danger", "info", "gray"].map((name) => [
      name,
      { base: "#6366f1", shades: foundationShades, overrides: {} },
    ]),
  ),
  surfaces: Object.fromEntries(["page", "sidebar", "topbar", "card", "elevated", "input"].map((name) => [name, { light: "#ffffff", dark: "#111827" }])),
  borders: { default: { light: "#e5e7eb", dark: "#374151" }, strong: { light: "#d1d5db", dark: "#4b5563" } },
  text: { primary: { light: "#111827", dark: "#f9fafb" }, muted: { light: "#6b7280", dark: "#9ca3af" }, disabled: { light: "#9ca3af", dark: "#6b7280" } },
  typography: {
    body: { kind: "system", name: "System", family: "ui-sans-serif, system-ui, sans-serif" },
    heading: { kind: "system", name: "System", family: "ui-sans-serif, system-ui, sans-serif" },
    mono: { kind: "system", name: "System Mono", family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace" },
  },
  spacing: { "0": 0, px: 1, "0.5": 2, "1": 4, "1.5": 6, "2": 8, "3": 12, "4": 16, "6": 24, "8": 32 },
  density: "default",
  radius: "md",
  borderWidth: 1,
  shadow: "sm",
};

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

  test("changes native Products, Orders, and Inventory table density immediately without requests", async ({
    page,
  }) => {
    const navigationRequests: string[] = [];
    const mutationRequests: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest()) navigationRequests.push(request.url());
      if (request.method() !== "GET") mutationRequests.push(request.url());
    });

    await page.goto(`${composeBaseUrl}/demo/admin/login`);
    await page.locator("#form\\.email").fill("user");
    await page.locator("#form\\.password").fill("password");
    await page.locator("#form").evaluate((form) => form.requestSubmit());
    await expect(page).toHaveURL(`${composeBaseUrl}/demo/admin`);
    await page.goto(composeBaseUrl);
    await expect(page.getByRole("heading", { name: "Filament Theme Builder" })).toBeVisible();
    await page.evaluate((tablesUrl) => {
      document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.src = tablesUrl;
    }, `${composeBaseUrl}/demo/admin/tables-showcase`);
    await expect
      .poll(() => page.frames().find((frame) => /\/demo\/admin\/tables-showcase/.test(frame.url()))?.url() ?? "")
      .toContain("/demo/admin/tables-showcase");
    const previewFrame = page.frame({ url: /\/demo\/admin\/tables-showcase/ });
    expect(previewFrame).toBeTruthy();
    await expect(previewFrame!.locator(".fi-ta")).toHaveCount(3);

    const iframe = page.locator('iframe[title="Filament preview"]');
    const initialIframeUrl = await iframe.getAttribute("src");
    const densityEvents = await previewFrame!.evaluate(() => {
      document.body.dataset.tableDensityEvents = "0";
      window.addEventListener("ftb:theme:updated", () => {
        document.body.dataset.tableDensityEvents = String(
          Number(document.body.dataset.tableDensityEvents) + 1,
        );
      });
      return Number(document.body.dataset.tableDensityEvents);
    });
    expect(densityEvents).toBe(0);

    const measure = () =>
      previewFrame!.evaluate(() =>
        Array.from(document.querySelectorAll(".fi-ta")).map((root) => ({
          heading: root.querySelector(".fi-ta-header-heading")?.textContent?.trim(),
          container: root.querySelector(".fi-ta-ctn")!.getBoundingClientRect().height,
          header: root.querySelector(".fi-ta-header")!.getBoundingClientRect().height,
          headerCell: root.querySelector(".fi-ta-header-cell")!.getBoundingClientRect().height,
          row: root.querySelector("tbody tr:not(.fi-ta-group-header-row)")!.getBoundingClientRect().height,
        })),
      );

    const expectedHeadings = [
      "Showcase products",
      "Orders table fixture",
      "Inventory table fixture",
    ];
    const defaultMeasurements = await measure();
    expect(defaultMeasurements.map(({ heading }) => heading)).toEqual(expectedHeadings);

    navigationRequests.length = 0;
    mutationRequests.length = 0;
    await page.getByRole("button", { name: "Compact density" }).click();
    await expect(page.locator("#density")).toHaveValue("compact");
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.tableDensityEvents)))
      .toBe(1);
    const compactMeasurements = await measure();

    await page.getByRole("button", { name: "Default density" }).click();
    await expect(page.locator("#density")).toHaveValue("default");
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.tableDensityEvents)))
      .toBe(2);
    const restoredMeasurements = await measure();

    await page.getByRole("button", { name: "Spacious density" }).click();
    await expect(page.locator("#density")).toHaveValue("spacious");
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.tableDensityEvents)))
      .toBe(3);
    const spaciousMeasurements = await measure();

    for (const index of [0, 1, 2]) {
      expect(compactMeasurements[index]!.container).toBeLessThan(defaultMeasurements[index]!.container);
      expect(defaultMeasurements[index]!.container).toBe(restoredMeasurements[index]!.container);
      expect(restoredMeasurements[index]!.container).toBeLessThan(spaciousMeasurements[index]!.container);
      expect(compactMeasurements[index]!.header).toBeLessThan(defaultMeasurements[index]!.header);
      expect(defaultMeasurements[index]!.header).toBeLessThan(spaciousMeasurements[index]!.header);
      expect(compactMeasurements[index]!.headerCell).toBeLessThan(defaultMeasurements[index]!.headerCell);
      expect(defaultMeasurements[index]!.headerCell).toBeLessThan(spaciousMeasurements[index]!.headerCell);
      expect(compactMeasurements[index]!.row).toBeLessThan(defaultMeasurements[index]!.row);
      expect(defaultMeasurements[index]!.row).toBeLessThan(spaciousMeasurements[index]!.row);
    }

    expect(await iframe.getAttribute("src")).toBe(initialIframeUrl);
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
      overrides: Record<string, unknown>[] = [],
    ) =>
      page.evaluate(
        ({ mapping, mode, targetOrigin, foundations, overrides }) => {
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
                foundations,
                overrides,
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
        { mapping, mode, targetOrigin, foundations: validFoundations, overrides },
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
      {
        id: "palette.primary.base",
        mapping: "preview-emulatable",
        variable: "--ftb-primary",
        value: "#0f766e",
      },
      "light",
      [{
        targetId: "button.primary",
        controlId: "background",
        scope: "global",
        componentId: "button",
        value: "#0f766e",
      }],
    );
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.acceptedMessages)))
      .toBe(0);

    await message(
      {
        id: "palette.primary.base",
        mapping: "preview-emulatable",
        variable: "--ftb-primary",
        value: "#0f766e",
      },
      "light",
      [{
        targetId: "button.primary",
        controlId: "background",
        scope: "global",
        value: "not-a-color",
      }],
    );
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.acceptedMessages)))
      .toBe(0);

    await message(
      { id: "radius", mapping: "unmapped", value: "lg" },
      "dark",
    );
    await expect
      .poll(() =>
        previewFrame!.evaluate(() => document.body.dataset.compatibilityNotice),
      )
      .toContain("radius");
    expect(
      await previewFrame!.evaluate(
        () => JSON.parse(document.body.dataset.compatibilityNotice!).mode,
      ),
    ).toBe("dark");
    expect(await previewFrame!.locator("#ftb-managed-theme").count()).toBe(0);
    const acceptedBeforeDensityChecks = await previewFrame!.evaluate(() => Number(document.body.dataset.acceptedMessages));

    await message(
      {
        id: "palette.primary.base",
        mapping: "preview-emulatable",
        variable: "--ftb-primary",
        value: "#0f766e",
      },
      "light",
    );
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.acceptedMessages)))
      .toBe(acceptedBeforeDensityChecks + 1);

    await message(
      {
        id: "palette.primary.base",
        mapping: "preview-emulatable",
        variable: "--ftb-primary",
        selector: ".attacker-controlled",
        value: "#0f766e",
      },
      "light",
    );
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.acceptedMessages)))
      .toBe(acceptedBeforeDensityChecks + 1);

    await message(
      {
        id: "density",
        mapping: "preview-emulatable",
        selector: ".fi-ta",
        value: "compact",
      },
      "light",
    );
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.acceptedMessages)))
      .toBe(acceptedBeforeDensityChecks + 2);
  });

  test("edits, resets, and persists the foundations editor without loading fonts", async ({
    page,
  }) => {
    const requestedUrls: string[] = [];
    const builderRequestedUrls: string[] = [];
    const navigationRequests: string[] = [];
    const mutationRequests: string[] = [];
    page.on("request", (request) => requestedUrls.push(request.url()));
    page.on("request", (request) => {
      if (request.frame() === page.mainFrame())
        builderRequestedUrls.push(request.url());
      if (request.isNavigationRequest()) navigationRequests.push(request.url());
      if (request.method() !== "GET") mutationRequests.push(request.url());
    });

    await page.goto(composeBaseUrl);
    const previewFrame = page.frame({ url: /\/demo\/admin/ });
    expect(previewFrame).toBeTruthy();
    await expect(
      page.getByRole("heading", { name: "Foundations" }),
    ).toBeVisible();
    await expect(page.locator("section.foundations")).toHaveClass(/grid/);
    await expect(page.locator("fieldset").first()).toHaveCSS("display", "grid");
    await expect(page.locator(".foundation-row").first()).toHaveCSS("display", "grid");
    await expect(page.locator(".foundation-row").first()).toHaveCSS("grid-template-columns", /.+/);

    await expect(page.locator("#primary-palette-base")).toBeVisible();
    await expect(page.getByLabel("Primary shade 500 override")).toBeVisible();
    await expect(page.locator("#spacing-1")).toBeVisible();
    await expect(page.locator("#border-default-light")).toBeVisible();
    await expect(page.locator("#border-strong-light")).toBeVisible();
    await expect(page.locator("#text-primary-light")).toBeVisible();
    await expect(page.locator("#text-muted-light")).toBeVisible();
    await expect(page.locator("#text-disabled-light")).toBeVisible();
    await expect(page.getByLabel("Body font type")).toBeVisible();
    await expect(page.getByLabel("Body font name")).toBeVisible();
    await expect(
      page.getByText("generated", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("unmapped", { exact: true }).first(),
    ).toBeVisible();
    navigationRequests.length = 0;
    mutationRequests.length = 0;

    await page.locator("#primary-palette-base").fill("#0f766e");
    await page.getByLabel("Primary shade 500 override").fill("#123456");
    await expect(
      page.getByText("explicit", { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Reset primary shade 500" }).click();
    await expect(page.getByLabel("Primary shade 500 override")).toHaveValue("");

    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect(
      page.getByRole("button", { name: "Dark mode" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        previewFrame!.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("color-scheme")
            .trim(),
        ),
      )
      .toBe("dark");
    await page.getByRole("button", { name: "Light mode" }).click();
    await expect
      .poll(() =>
        previewFrame!.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("color-scheme")
            .trim(),
        ),
      )
      .toBe("light");

    await page.locator("#spacing-1").fill("20");
    await page
      .getByRole("button", { name: "Reset spacing 1", exact: true })
      .click();
    await expect(page.locator("#spacing-1")).toHaveValue("4");
    await page.locator("#border-default-light").fill("#123456");
    await page
      .getByRole("button", { name: "Reset border default light" })
      .click();
    await expect(page.locator("#border-default-light")).toHaveValue(
      "var(--gray-200)",
    );
    await page.locator("#text-muted-light").fill("#123456");
    await page.getByRole("button", { name: "Reset text muted light" }).click();
    await expect(page.locator("#text-muted-light")).toHaveValue(
      "var(--gray-500)",
    );

    await page.getByLabel("Body font type").selectOption("curated:Inter");
    await expect(page.getByLabel("Body font name")).toHaveValue("Inter");
    await page.getByLabel("Body font type").selectOption("custom");
    await page.getByLabel("Body font name").fill("Editorial Sans");
    await page.getByRole("button", { name: "Reset body font" }).click();
    await expect(page.getByLabel("Body font name")).toHaveValue("System");

    await page.getByRole("button", { name: "Compact density" }).click();
    await expect(page.locator("#density")).toHaveValue("compact");
    await page.getByRole("button", { name: "Spacious density" }).click();
    await expect(page.locator("#density")).toHaveValue("spacious");

    await page.getByLabel("Body font name").fill("Editorial Sans");
    await page.locator("#radius").selectOption("lg");
    await page.locator("#border-width").fill("2");
    await page.locator("#shadow").selectOption("lg");
    await page.getByRole("button", { name: "Reset body font" }).click();
    await expect(page.getByLabel("Body font name")).toHaveValue("System");
    expect(navigationRequests).toEqual([]);
    expect(mutationRequests).toEqual([]);

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("ftb-theme")))
      .toContain('"radius":"lg"');
    await page.reload();
    await expect(page.locator("#primary-palette-base")).toHaveValue("#0f766e");
    await expect(page.locator("#density")).toHaveValue("spacious");
    await expect(page.locator("#radius")).toHaveValue("lg");
    await expect(page.locator("#border-width")).toHaveValue("2");
    await expect(page.locator("#shadow")).toHaveValue("lg");
    await expect(page.getByLabel("Body font name")).toHaveValue("System");

    expect(
      requestedUrls.filter((url) => /fonts\.|googleapis/i.test(url)),
    ).toEqual([]);
    expect(
      builderRequestedUrls.filter((url) =>
        /\/fonts?\/|\.woff2?(\?|$)|\.ttf(\?|$)|\.otf(\?|$)/i.test(
          new URL(url).pathname,
        ),
      ),
    ).toEqual([]);
  });
});
