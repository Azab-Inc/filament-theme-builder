import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

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

  const computedColorPixel = (context: import("@playwright/test").Page | import("@playwright/test").Frame, selector: string) =>
    context.locator(selector).evaluate((element) => {
      const color = getComputedStyle(element).backgroundColor;
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    });

  const colorPixel = (context: import("@playwright/test").Page | import("@playwright/test").Frame, color: string) =>
    context.evaluate((value) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    }, color);

  test("archives malformed persisted JSON for download and keeps restoration disabled", async ({ page }) => {
    const original = "{malformed legacy JSON"
    await page.addInitScript((raw) => localStorage.setItem("ftb-theme", raw), original)
    await page.goto(composeBaseUrl)

    await expect(page.getByRole("alert")).toContainText("not valid JSON")
    const restore = page.getByRole("button", { name: "Restore legacy customization" })
    await expect(restore).toBeDisabled()
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: "Download archived legacy JSON" }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("filament-theme-legacy-recovery.json")
    expect(await readFile((await download.path())!, "utf8")).toBe(original)
    expect(await page.evaluate(() => localStorage.getItem("ftb-theme-legacy-recovery"))).toBe(original)
  })

  test("accepts a red Tailwind shade reference for the native sidebar surface", async ({ page }) => {
    await page.goto(composeBaseUrl)
    await expect(page.getByRole("heading", { name: "Filament Theme Builder" })).toBeVisible()
    const iframe = page.locator('iframe[title="Filament preview"]')
    const nativePage = await page.context().newPage()
    await nativePage.goto(`${composeBaseUrl}/demo/admin`)
    const nativeSidebarColor = await computedColorPixel(nativePage, '.fi-sidebar')
    const frame = page.frames().find((candidate) => candidate.url().includes("/demo/admin"))
    expect(frame).toBeTruthy()
    await expect.poll(() => computedColorPixel(frame!, '.fi-sidebar')).toEqual(nativeSidebarColor)
    await frame!.evaluate(() => {
      (window as Window & { __sidebarAccepted?: number }).__sidebarAccepted = 0
      window.addEventListener("ftb:preview-message-accepted", () => {
        (window as Window & { __sidebarAccepted?: number }).__sidebarAccepted! += 1
      })
    })

    const sidebarSurface = page.locator("#sidebar-surface")
    await sidebarSurface.fill("var(--gray-200)")
    await expect.poll(() => page.evaluate(() => {
      const raw = localStorage.getItem("ftb-theme")
      return raw ? JSON.parse(raw).foundations.surfaces.sidebar.light : null
    })).toBe("var(--gray-200)")
    await expect.poll(() => frame!.evaluate(() => (window as Window & { __sidebarAccepted?: number }).__sidebarAccepted)).toBe(1)

    await sidebarSurface.fill("var(--red-200)")

    await expect.poll(() => frame!.evaluate(() => (window as Window & { __sidebarAccepted?: number }).__sidebarAccepted)).toBe(2)
    await expect.poll(() => page.evaluate(() => {
      const raw = localStorage.getItem("ftb-theme")
      return raw ? JSON.parse(raw).foundations.surfaces.sidebar.light : null
    })).toBe("var(--red-200)")
    await expect.poll(() => computedColorPixel(frame!, ".fi-sidebar")).toEqual(await colorPixel(frame!, "oklch(88.5% 0.062 18.334)"))

    await sidebarSurface.fill("var(--color-red-200)")
    await expect.poll(() => computedColorPixel(frame!, ".fi-sidebar")).toEqual(await colorPixel(frame!, "oklch(88.5% 0.062 18.334)"))

    await sidebarSurface.fill("var(--sky-950)")
    await expect.poll(() => computedColorPixel(frame!, ".fi-sidebar")).toEqual(await colorPixel(frame!, "oklch(29.3% 0.066 243.157)"))
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ftb-theme")!).foundations.surfaces.sidebar.light)).toBe("var(--sky-950)")
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: "Export theme JSON" }).click()
    const download = await downloadPromise
    const exported = JSON.parse(await readFile((await download.path())!, "utf8"))
    expect(exported.foundations.surfaces.sidebar.light).toBe("var(--sky-950)")
    await page.getByRole("button", { name: "Reset sidebar surface" }).click()
    await expect.poll(() => computedColorPixel(frame!, '.fi-sidebar')).toEqual(nativeSidebarColor)
    await nativePage.close()
    expect(await iframe.getAttribute("src")).toContain("/demo/admin")
  })

  test("rejects an unknown color reference visibly without changing persistence", async ({ page }) => {
    await page.goto(composeBaseUrl)
    const sidebarSurface = page.locator("#sidebar-surface")
    const before = await page.evaluate(() => localStorage.getItem("ftb-theme"))

    await sidebarSurface.fill("var(--not-a-tailwind-color)")

    await expect(page.locator('[data-foundation-error="surfaces.sidebar.light"]')).toContainText("Unsupported color reference")
    await expect.poll(() => page.evaluate(() => localStorage.getItem("ftb-theme"))).toBe(before)
  })

  test("preserves native palette defaults until a family is explicitly edited", async ({ page }) => {
    await page.goto(composeBaseUrl);
    const nativePage = await page.context().newPage();
    await nativePage.goto(`${composeBaseUrl}/demo/admin/showcase`);
    const nativeBackground = await nativePage.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
    const nativePrimary = await nativePage.locator(".fi-badge.fi-color-primary").first().evaluate((element) => getComputedStyle(element).backgroundColor);

    await page.evaluate((showcaseUrl) => {
      document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.src = showcaseUrl;
    }, `${composeBaseUrl}/demo/admin/showcase`);
    await expect.poll(() => page.frames().find((frame) => /\/demo\/admin\/showcase/.test(frame.url()))?.url() ?? "").toContain("/demo/admin/showcase");
    const preview = page.frame({ url: /\/demo\/admin\/showcase/ })!;
    await expect(preview.locator("body")).toBeVisible();
    await expect.poll(() => preview.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(nativeBackground);

    const primaryElement = preview.locator(".fi-badge.fi-color-primary").first();
    const initialPrimary = await primaryElement.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(initialPrimary).toBe(nativePrimary);
    await page.getByLabel("Primary color").fill("#0f766e");
    await expect.poll(() => primaryElement.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialPrimary);

    const initialGrayBackground = await preview.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.locator("#gray-palette-base").fill("#123456");
    await expect.poll(() => preview.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--gray-50").trim())).not.toBe("");
    await expect.poll(() => preview.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialGrayBackground);
    await nativePage.close();
  });

  test("accepts eight-digit palette bases and overrides and renders their alpha", async ({ page }) => {
    await page.goto(composeBaseUrl);
    const routeNavigation = page.waitForEvent("framenavigated", (frame) =>
      /\/demo\/admin\/showcase/.test(frame.url()),
    );
    await page.evaluate((showcaseUrl) => {
      document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.src = showcaseUrl;
    }, `${composeBaseUrl}/demo/admin/showcase`);
    const preview = await routeNavigation;
    const primaryButton = preview.locator(".fi-badge.fi-color-primary").first();

    await page.locator("#primary-palette-base").fill("#ff000080");
    await expect.poll(() => page.evaluate(() => {
      const theme = localStorage.getItem("ftb-theme");
      return theme ? JSON.parse(theme).foundations.palettes.primary.base : null;
    }))
      .toBe("#ff000080");
    await expect.poll(() => primaryButton.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toMatch(/^rgba?\(/);
    const baseColor = await primaryButton.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(baseColor).toContain("0.5");

    await page.getByLabel("Primary shade 700 override").fill("#0000ff80");
    await expect.poll(() => page.evaluate(() => {
      const theme = localStorage.getItem("ftb-theme");
      return theme ? JSON.parse(theme).foundations.palettes.primary.overrides[700] : null;
    }))
      .toBe("#0000ff80");
    await expect.poll(() => primaryButton.evaluate((element) => getComputedStyle(element).color))
      .toBe("rgba(0, 0, 255, 0.5)");
  });

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
    await expect(page.getByLabel("Text primary light").locator("xpath=..").getByRole("status")).toHaveText("inherited");
    await expect(
      preview.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
    await page.evaluate((showcaseUrl) => {
      document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.src = showcaseUrl;
    }, `${composeBaseUrl}/demo/admin/showcase`);
    await expect
      .poll(() => page.frames().find((frame) => /\/demo\/admin\/showcase/.test(frame.url()))?.url() ?? "")
      .toContain("/demo/admin/showcase");
    const primaryBadge = page.frame({ url: /\/demo\/admin\/showcase/ })!.locator(".fi-badge.fi-color-primary").first();
    await expect(primaryBadge).toBeVisible();
    const initialPrimaryBackground = await primaryBadge.evaluate((element) =>
      getComputedStyle(element).backgroundColor,
    );

    const iframe = page.locator('iframe[title="Filament preview"]');
    const iframeUrl = await iframe.getAttribute("src");
    expect(new URL(iframeUrl!, page.url()).pathname).toBe("/demo/admin/showcase");
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
    await expect
      .poll(() =>
        primaryBadge.evaluate((element) => getComputedStyle(element).backgroundColor),
      )
      .not.toBe(initialPrimaryBackground);

    expect(navigationRequests).toEqual([]);
    expect(mutationRequests).toEqual([]);
  });

  test("projects foundation changes onto real infolist entries in light and dark modes", async ({ page }) => {
    await page.goto(`${composeBaseUrl}/demo/admin/login`);
    await page.getByLabel(/username/i).fill("user");
    await page.getByRole("textbox", { name: /password/i }).fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(`${composeBaseUrl}/demo/admin`);
    await page.goto(composeBaseUrl);
    await expect(page.locator('iframe[title="Filament preview"]')).toBeVisible();
    const routeNavigation = page.waitForEvent("framenavigated", (frame) =>
      /\/demo\/admin\/infolists-showcase/.test(frame.url()),
    );
    await page.evaluate((showcaseUrl) => {
      document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.src = showcaseUrl;
    }, `${composeBaseUrl}/demo/admin/infolists-showcase`);
    const navigatedFrame = await routeNavigation;

    const frame = navigatedFrame;
    const statusBadge = frame.locator(".fi-in-text-item.fi-in-text-has-badges").first();
    const section = frame.getByRole("region", { name: "Product overview" });
    await expect(statusBadge).toBeVisible();
    await expect(section).toBeVisible();

    await page.emulateMedia({ colorScheme: "light" });
    const lightText = await frame.locator(".fi-in-text").first().evaluate((element) => getComputedStyle(element).color);
    const lightSection = await section.evaluate((element) => getComputedStyle(element).backgroundColor);

    await page.getByLabel("Primary color").fill("#0f766e");
    await expect.poll(() => statusBadge.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("");
    await expect.poll(() => statusBadge.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightSection);

    await page.emulateMedia({ colorScheme: "dark" });
    const darkText = await frame.locator(".fi-in-text").first().evaluate((element) => getComputedStyle(element).color);
    const darkSection = await section.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkText).not.toBe(lightText);
    expect(darkSection).not.toBe(lightSection);
    await expect(frame.locator(".fi-in-table-repeatable")).toBeVisible();
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
    const nativePage = await page.context().newPage();
    await nativePage.goto(`${composeBaseUrl}/demo/admin/tables-showcase`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
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

    const measure = (frame: import("@playwright/test").Frame | import("@playwright/test").Page) =>
      frame.evaluate(() =>
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
    const nativeMeasurements = await measure(nativePage);
    const defaultMeasurements = await measure(previewFrame!);
    expect(defaultMeasurements.map(({ heading }) => heading)).toEqual(expectedHeadings);

    navigationRequests.length = 0;
    mutationRequests.length = 0;
    await page.getByRole("button", { name: "Compact density" }).click();
    await expect(page.locator("#density")).toHaveValue("compact");
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.tableDensityEvents)))
      .toBe(1);
    const compactMeasurements = await measure(previewFrame!);

    await page.getByRole("button", { name: "Reset density" }).click();
    await expect(page.locator("#density")).toHaveValue("default");
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.tableDensityEvents)))
      .toBe(2);
    const restoredMeasurements = await measure(previewFrame!);

    await page.getByRole("button", { name: "Spacious density" }).click();
    await expect(page.locator("#density")).toHaveValue("spacious");
    await expect
      .poll(() => previewFrame!.evaluate(() => Number(document.body.dataset.tableDensityEvents)))
      .toBe(3);
    const spaciousMeasurements = await measure(previewFrame!);

    for (const index of [0, 1, 2]) {
      expect(compactMeasurements[index]!.container).toBeLessThan(defaultMeasurements[index]!.container);
      expect(restoredMeasurements[index]).toEqual(nativeMeasurements[index]);
      expect(compactMeasurements[index]!.header).toBeLessThan(defaultMeasurements[index]!.header);
      expect(compactMeasurements[index]!.headerCell).toBeLessThan(defaultMeasurements[index]!.headerCell);
      expect(compactMeasurements[index]!.row).toBeLessThan(defaultMeasurements[index]!.row);
      expect(spaciousMeasurements[index]!.container).toBeGreaterThan(compactMeasurements[index]!.container);
      expect(spaciousMeasurements[index]!.header).toBeGreaterThan(compactMeasurements[index]!.header);
      expect(spaciousMeasurements[index]!.headerCell).toBeGreaterThan(compactMeasurements[index]!.headerCell);
      expect(spaciousMeasurements[index]!.row).toBeGreaterThan(compactMeasurements[index]!.row);
    }

    expect(await iframe.getAttribute("src")).toBe(initialIframeUrl);
    expect(navigationRequests).toEqual([]);
    expect(mutationRequests).toEqual([]);
  });

  test("rejects forged projections and out-of-scope overrides in the real iframe", async ({ page }) => {
    await page.goto(composeBaseUrl);
    await expect(page.getByLabel("Primary color")).toBeVisible();
    const frame = page.frame({ url: /\/demo\/admin/ });
    expect(frame).toBeTruthy();
    await frame!.evaluate(() => {
      const capture = window as Window & { __ftbMessage?: unknown; __ftbAccepted?: number };
      capture.__ftbAccepted = 0;
      window.addEventListener("message", (event) => {
        if (event.data?.type === "ftb:theme:update") capture.__ftbMessage = event.data;
      });
      window.addEventListener("ftb:preview-message-accepted", () => { capture.__ftbAccepted! += 1; });
    });
    await page.getByLabel("Primary color").fill("#0f766e");
    await page.locator("#border-width").fill("1");
    await expect.poll(() => frame!.evaluate(() => Boolean((window as Window & { __ftbMessage?: unknown }).__ftbMessage))).toBe(true);
    const valid = await frame!.evaluate(() => (window as Window & { __ftbMessage: Record<string, any> }).__ftbMessage);
    const before = await frame!.evaluate(() => (window as Window & { __ftbAccepted: number }).__ftbAccepted);
    expect(before).toBeGreaterThan(0);

    const postAndCheckRejected = async (mutate: (message: Record<string, any>) => void) => {
      const message = structuredClone(valid) as Record<string, any>;
      mutate(message);
      const accepted = await page.evaluate(async (payload) => {
        const target = document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.contentWindow!;
        return await new Promise<boolean>((resolve) => {
          const listener = () => { window.removeEventListener("ftb:preview-message-accepted", listener); resolve(true); };
          target.addEventListener("ftb:preview-message-accepted", listener, { once: true });
          target.postMessage(payload, location.origin);
          window.setTimeout(() => { window.removeEventListener("ftb:preview-message-accepted", listener); resolve(false); }, 100);
        });
      }, message);
      expect(accepted).toBe(false);
    };

    await postAndCheckRejected((message) => { message.projection.mappings.push({ id: "unknown", mapping: "live-emulation", property: "color", selectors: ["body"], value: "#123456" }); });
    await postAndCheckRejected((message) => { message.projection.mappings[0].selectors = [".attacker-controlled"]; });
    await postAndCheckRejected((message) => { message.projection.mappings.find((mapping: Record<string, unknown>) => mapping.id === "borderWidth").value = "1"; });
    await postAndCheckRejected((message) => { message.projection.mappings.find((mapping: Record<string, unknown>) => mapping.id === "borderWidth").value = Number.POSITIVE_INFINITY; });
    await postAndCheckRejected((message) => { message.projection.mappings.find((mapping: Record<string, unknown>) => mapping.id === "palette.primary.base").value = "#abcdef"; });
    await postAndCheckRejected((message) => { message.projection.mode = "dark"; });
    await postAndCheckRejected((message) => { message.theme.overrides = [{ targetId: "button.primary", controlId: "background", scope: "global", componentId: "button", value: "#0f766e" }]; });
    await postAndCheckRejected((message) => { message.theme.overrides = [{ targetId: "button.primary", controlId: "background", scope: "global", value: "not-a-color" }]; });
    await postAndCheckRejected((message) => { message.theme.foundations.explicitPaths = ["density", "density"]; });
    await postAndCheckRejected((message) => { message.theme.foundations.explicitPaths = ["palettes.primary.overrides.500"]; });
    await postAndCheckRejected((message) => { message.theme.colors.primary = "#123456"; });
    await postAndCheckRejected((message) => { message.theme.foundations.palettes.primary.base = "#12345"; });
    await postAndCheckRejected((message) => { message.theme.foundations.palettes.primary.shades[500] = "#12345"; });
    await postAndCheckRejected((message) => { message.theme.foundations.palettes.primary.overrides[500] = "#12345"; });
  });

  test("projects every foundation family live in the iframe without reload", async ({ page }) => {
    const navigationRequests: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest()) navigationRequests.push(request.url());
    });
    await page.goto(composeBaseUrl);
    let previewFrame = page.frame({ url: /\/demo\/admin/ });
    expect(previewFrame).toBeTruthy();
    await expect(previewFrame!.locator("#ftb-managed-theme")).toHaveCount(1);
    await page.evaluate((showcaseUrl) => {
      document.querySelector<HTMLIFrameElement>('iframe[title="Filament preview"]')!.src = showcaseUrl;
    }, `${composeBaseUrl}/demo/admin/showcase`);
    await expect.poll(() => page.frames().find((frame) => /\/demo\/admin\/showcase/.test(frame.url()))?.url() ?? "").toContain("/demo/admin/showcase");
    previewFrame = page.frame({ url: /\/demo\/admin\/showcase/ });
    expect(previewFrame).toBeTruthy();
    await expect(previewFrame!.locator(".fi-badge.fi-color-primary").first()).toBeVisible();
    navigationRequests.length = 0;

    const readFoundationToken = (id: string) => previewFrame!.evaluate((token) => getComputedStyle(document.documentElement).getPropertyValue(`--ftb-foundation-${token}`).trim(), id.replaceAll(".", "-"));
    const paletteNames = ["primary", "success", "warning", "danger", "info", "gray"];
    for (const name of paletteNames) {
      const input = page.locator(`#${name}-palette-base`);
      await input.fill(name === "primary" ? "#0f766e" : "#123456");
      await expect.poll(() => previewFrame!.evaluate((palette) => getComputedStyle(document.documentElement).getPropertyValue(`--ftb-${palette}`).trim(), name)).toBe(name === "primary" ? "#0f766e" : "#123456");
      await page.getByLabel(`${name} shade 500 override`).fill("#654321");
      await expect.poll(() => previewFrame!.evaluate((palette) => getComputedStyle(document.documentElement).getPropertyValue(`--${palette}-500`).trim(), name)).toBe("#654321");
    }

    const primaryElement = previewFrame!.locator(".fi-badge.fi-color-primary").first();
    await expect(primaryElement).toBeVisible();
    const primaryTextBefore = await primaryElement.evaluate((element) => getComputedStyle(element).color);
    await page.getByLabel("Primary shade 700 override").fill("#ff0000");
    await expect.poll(() => primaryElement.evaluate((element) => getComputedStyle(element).color)).not.toBe(primaryTextBefore);
    await expect.poll(() => primaryElement.evaluate((element) => getComputedStyle(element).getPropertyValue("--ftb-palette-primary-shades-500").trim())).toBe("#654321");

    for (const [id, token] of Object.entries({ "card-surface": "surface.card", "sidebar-surface": "surface.sidebar", "topbar-surface": "surface.topbar", "elevated-surface": "surface.elevated", "input-surface": "surface.input", "page-surface": "surface.page", "border-default-light": "border.default", "border-strong-light": "border.strong", "text-primary-light": "text.primary", "text-muted-light": "text.muted", "text-disabled-light": "text.disabled" })) {
      const control = page.locator(`#${id}`);
      await control.fill(id.includes("border") || id.includes("text") ? "#123456" : "#fedcba");
      await expect.poll(() => readFoundationToken(token)).toMatch(/^(#123456|#fedcba)$/);
    }

    for (const name of ["body", "heading", "mono"]) {
      await page.locator(`#${name}-font-name`).fill(`Local ${name} Family`);
      await expect.poll(() => readFoundationToken(`typography.${name}`)).toBe(`Local ${name} Family`);
    }

    for (const key of ["0", "px", "0.5", "1", "1.5", "2", "3", "4", "6", "8"]) {
      const input = page.locator(`#spacing-${key.replace(".", "-")}`);
      await input.fill("19");
      await expect(input, `spacing editor ${key}`).toHaveValue("19");
      await expect.poll(() => readFoundationToken(`spacing.${key}`), { message: `project spacing.${key}` }).toBe("19");
    }

    const section = previewFrame!.locator(".fi-section, .fi-ta-ctn").first();
    await expect(section).toBeVisible();
    for (const radius of ["none", "sm", "md", "lg", "xl", "full"]) {
      await page.locator("#radius").selectOption(radius);
      const expected = { none: "0px", sm: "2px", md: "6px", lg: "8px", xl: "12px", full: "9999px" }[radius];
      await expect.poll(() => section.evaluate((element) => getComputedStyle(element).borderRadius)).toBe(expected);
    }
    await page.locator("#border-width").fill("4");
    await expect.poll(() => section.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe("4px");
    const input = previewFrame!.locator(".fi-input").first();
    await expect(input).toBeVisible();
    await page.locator("#spacing-1").fill("19");
    await expect.poll(() => input.evaluate((element) => getComputedStyle(element).paddingTop)).toBe("19px");
    for (const shadow of ["none", "sm", "md", "lg", "xl"]) {
      await page.locator("#shadow").selectOption(shadow);
      const expectedShadow = shadow === "none" ? "none" : "not-none";
      const shadowStyle = () => section.evaluate((element) => getComputedStyle(element).boxShadow);
      if (expectedShadow === "none") await expect.poll(shadowStyle).toBe("none");
      else await expect.poll(shadowStyle).not.toBe("none");
    }
    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect.poll(() => previewFrame!.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await expect.poll(() => previewFrame!.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
    await page.locator("#card-surface").fill("#123456");
    await page.locator("#text-primary-dark").fill("#fefefe");
    const darkSurface = await previewFrame!.locator(".fi-section").first().evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkSurface).toBe("rgb(18, 52, 86)");
    const darkText = await previewFrame!.locator("body").evaluate((element) => getComputedStyle(element).color);
    expect(darkText).toBe("rgb(254, 254, 254)");
    expect(navigationRequests).toEqual([]);
  });

  test("covers every foundation control through rendered native showcase elements", async ({ page }) => {
    test.setTimeout(120_000);
    const navigationRequests: string[] = [];
    const mutationRequests: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest()) navigationRequests.push(request.url());
      if (request.frame() === page.mainFrame() && request.method() !== "GET") mutationRequests.push(request.url());
    });

    await page.goto(`${composeBaseUrl}/demo/admin/login`);
    await page.locator("#form\\.email").fill("user");
    await page.locator("#form\\.password").fill("password");
    await page.locator("#form").evaluate((form) => (form as HTMLFormElement).requestSubmit());
    await expect(page).toHaveURL(`${composeBaseUrl}/demo/admin`);
    await page.goto(composeBaseUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole("heading", { name: "Filament Theme Builder" })).toBeVisible();

    const setPreviewRoute = async (path: string, selector: string) => {
      const url = `${composeBaseUrl}${path}`;
      const routePattern = new RegExp(path.replaceAll("/", "\\/"));
      const routeNavigation = page.waitForEvent("framenavigated", (candidate) => routePattern.test(candidate.url()));
      await page.locator('iframe[title="Filament preview"]').evaluate((iframe, nextUrl) => {
        iframe.src = nextUrl;
      }, url);
      const frame = await routeNavigation;
      await expect(frame!.locator(selector).first()).toBeVisible();
      await frame!.evaluate(() => {
        document.body.dataset.matrixAccepted = "0";
        (window as Window & { __matrixAccepted?: boolean }).__matrixAccepted = false;
        window.addEventListener("ftb:theme:updated", () => {
          document.body.dataset.matrixAccepted = String(Number(document.body.dataset.matrixAccepted) + 1);
          (window as Window & { __matrixAccepted?: boolean }).__matrixAccepted = true;
        });
      });
      navigationRequests.length = 0;
      mutationRequests.length = 0;
      return frame!;
    };

    const applyCase = async (
      frame: import("@playwright/test").Frame,
      control: string,
      value: string,
      target: string,
      read: (element: import("@playwright/test").Locator) => Promise<string>,
      expected?: string,
    ) => {
      const iframe = page.locator('iframe[title="Filament preview"]');
      const initialUrl = await iframe.getAttribute("src");
      const element = frame.locator(target).first();
      const before = await read(element);
      await frame.evaluate(() => { (window as Window & { __matrixAccepted?: boolean }).__matrixAccepted = false; });
      const input = page.locator(control);
      if (await input.evaluate((node) => node instanceof HTMLSelectElement)) await input.selectOption(value);
      else await input.fill(value);
      if (expected === undefined) {
        await expect.poll(() => read(element), { message: `native effect for ${control} on ${target}` }).not.toBe(before);
      } else {
        await expect.poll(() => read(element), { message: `native value for ${control} on ${target}` }).toBe(expected);
      }
      await expect.poll(() => frame.evaluate(() => Boolean((window as Window & { __matrixAccepted?: boolean }).__matrixAccepted))).toBe(true);
      expect(await iframe.getAttribute("src")).toBe(initialUrl);
      expect(navigationRequests).toEqual([]);
      expect(mutationRequests).toEqual([]);
      navigationRequests.length = 0;
      mutationRequests.length = 0;
    };

    const readStyle = (property: string) => (element: import("@playwright/test").Locator) =>
      element.evaluate((node, name) => getComputedStyle(node).getPropertyValue(name).trim(), property);

    const actions = await setPreviewRoute("/demo/admin/actions-showcase", ".fi-btn.fi-color-primary");
    await applyCase(actions, '[aria-label="Primary color"]', "#abcdef", ".fi-btn.fi-color-primary", readStyle("background-color"));
    for (const palette of ["primary", "success", "warning", "danger", "info", "gray"]) {
      const target = `.foundation-palette-${palette}`;
      await applyCase(actions, `#${palette}-palette-base`, palette === "primary" ? "#0f766e" : "#123456", target, readStyle("--ftb-palette"));
    }

    // Each shade is asserted through the native Filament palette variable on a
    // real colored action, while base edits above assert the visible element.
    for (const palette of ["primary", "success", "warning", "danger", "info", "gray"]) {
      for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
        const target = `.foundation-palette-${palette}`;
        const shadeValue = readStyle(`--${palette}-${shade}`);
        const current = await shadeValue(actions.locator(target).first());
        const value = current.toLowerCase() === "#abcdef" ? "#123456" : "#abcdef";
        await applyCase(actions, `[aria-label="${palette} shade ${shade} override"]`, value, target, shadeValue, value);
      }
    }

    let showcase = actions;
    for (const [control, target, property, value] of [
      ["#page-surface", "body", "background-color", "#fedcba"],
      ["#sidebar-surface", ".fi-sidebar", "background-color", "#f0d0d0"],
      ["#topbar-surface", ".fi-topbar", "background-color", "#d0f0d0"],
      ["#card-surface", ".fi-section", "background-color", "#d0d0f0"],
      ["#border-strong-light", ".fi-section", "border-top-color", "#2c1b0a"],
      ["#text-primary-light", "body", "color", "#112233"],
      ["#text-muted-light", "[data-foundation-muted]", "color", "#223344"],
      ["#text-disabled-light", "[data-foundation-disabled]", "color", "#334455"],
    ] as const) {
      await applyCase(showcase, control, value, target, readStyle(property));
    }

    const forms = await setPreviewRoute("/demo/admin/forms-showcase", ".fi-input");
    for (const [control, target, property, value] of [
      ["#input-surface", ".fi-input", "background-color", "#fef3c7"],
      ["#border-default-light", ".fi-input", "border-top-color", "#1a2b3c"],
    ] as const) {
      await applyCase(forms, control, value, target, readStyle(property));
    }

    const typography = await setPreviewRoute("/demo/admin/actions-showcase", ".foundation-palette-primary");
    for (const [control, target, value] of [
      ["#body-font-name", "body", "EditorialBody"],
      ["#heading-font-name", "[data-foundation-heading]", "EditorialHeading"],
      ["#mono-font-name", "[data-foundation-mono]", "EditorialMono"],
    ] as const) {
      await applyCase(typography, control, value, target, readStyle("font-family"));
    }
    showcase = typography;

    const spacingCases = [
      ["0", showcase, ".fi-sidebar"], ["px", showcase, ".fi-topbar"], ["0.5", showcase, ".fi-btn"],
      ["1", forms, ".fi-input"], ["1.5", showcase, ".fi-section"], ["2", showcase, ".fi-section > div"],
      ["8", showcase, ".fi-page"],
    ] as const;
    for (const [key, frame, target] of spacingCases) {
      await applyCase(frame, `#spacing-${key.replace(".", "-")}`, "19", target, readStyle("padding-block-start"));
    }
    const tables = await setPreviewRoute("/demo/admin/tables-showcase", ".fi-ta-header");
    for (const [key, target] of [["3", ".fi-ta-header"], ["4", ".fi-ta-ctn"]] as const) {
      await applyCase(tables, `#spacing-${key}`, "19", target, readStyle("padding-block-start"));
    }

    const modal = await setPreviewRoute("/demo/admin/actions-showcase", ".foundation-palette-primary");
    await modal.getByRole("button", { name: "Confirmation modal" }).click();
    await expect(modal.locator(".fi-modal-window")).toBeVisible();
    await applyCase(modal, "#spacing-6", "19", ".fi-modal", readStyle("padding-block-start"));
    await applyCase(modal, "#elevated-surface", "#dbeafe", ".fi-modal-window", readStyle("background-color"));
    await modal.getByRole("button", { name: "Cancel" }).evaluate((button) => (button as HTMLElement).click());
    await expect(modal.locator(".fi-modal-window")).toBeHidden();

    const layout = modal;
    for (const radius of ["none", "sm", "md", "lg", "xl", "full"]) {
      await applyCase(layout, "#radius", radius, ".fi-section", readStyle("border-radius"));
    }
    for (const width of ["0", "1", "2", "4", "8"]) {
      await applyCase(layout, "#border-width", width, ".fi-section", readStyle("border-top-width"), `${width}px`);
    }
    for (const shadow of ["none", "sm", "md", "lg", "xl"]) {
      await applyCase(layout, "#shadow", shadow, ".fi-section", readStyle("box-shadow"));
    }

    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect.poll(() => layout.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await expect.poll(() => layout.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
    await expect.poll(() => layout.evaluate(() => Number(document.body.dataset.matrixAccepted))).toBeGreaterThan(0);
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
      // The embedded Filament dashboard can issue its own Livewire widget polls.
      if (request.frame() === page.mainFrame() && request.method() !== "GET")
        mutationRequests.push(request.url());
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
      page.getByText("live-emulation", { exact: true }).first(),
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

  test("exports the complete canonical foundation state with generated palette parity", async ({ page }) => {
    await page.goto(composeBaseUrl);
    await page.locator("#primary-palette-base").fill("#0f766e");
    await page.getByLabel("Primary shade 500 override").fill("#123456");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("ftb-theme"))).toContain("#123456");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export theme JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("filament-theme.json");
    const exported = JSON.parse(await readFile((await download.path())! , "utf8")) as typeof validFoundations & {
      schemaVersion: number;
      colors: { primary: string };
      foundations: typeof validFoundations;
    };

    expect(exported.schemaVersion).toBe(4);
    expect(exported.colors.primary).toBe("#0f766e");
    expect(exported.foundations.palettes.primary.base).toBe("#0f766e");
    expect(exported.foundations.palettes.primary.shades[500]).toBe("#123456");
    expect(Object.keys(exported.foundations.palettes)).toEqual(
      expect.arrayContaining(["primary", "success", "warning", "danger", "info", "gray"]),
    );
    expect(Object.keys(exported.foundations.spacing)).toEqual(
      expect.arrayContaining(["0", "px", "0.5", "1", "1.5", "2", "3", "4", "6", "8"]),
    );
  });
});
