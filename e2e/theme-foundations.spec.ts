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
    await expect(page.getByLabel("Text primary light").locator("xpath=..").getByRole("status")).toHaveText("inherited");
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

    await postAndCheckRejected((message) => { message.projection.mappings.pop(); });
    await postAndCheckRejected((message) => { message.projection.mappings[0].selectors = [".attacker-controlled"]; });
    await postAndCheckRejected((message) => { message.projection.mappings.find((mapping: Record<string, unknown>) => mapping.id === "borderWidth").value = "1"; });
    await postAndCheckRejected((message) => { message.projection.mappings.find((mapping: Record<string, unknown>) => mapping.id === "borderWidth").value = Number.POSITIVE_INFINITY; });
    await postAndCheckRejected((message) => { message.theme.overrides = [{ targetId: "button.primary", controlId: "background", scope: "global", componentId: "button", value: "#0f766e" }]; });
    await postAndCheckRejected((message) => { message.theme.overrides = [{ targetId: "button.primary", controlId: "background", scope: "global", value: "not-a-color" }]; });
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
});
