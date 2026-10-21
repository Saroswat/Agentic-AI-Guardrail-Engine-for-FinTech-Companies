import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, username: string) {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Investigation workspace" }),
  ).toBeVisible();
}

test("analyst investigates and independent reviewer approves the exact proposal", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_PASSWORD,
    "Set E2E_PASSWORD for local seeded accounts.",
  );
  await login(page, "analyst");
  const select = page.getByRole("combobox", { name: "Case", exact: true });
  await expect.poll(() => select.locator("option").count()).toBeGreaterThan(1);
  await select.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Queue investigation" }).click();
  await expect(
    page.getByRole("heading", { name: "Investigation brief" }),
  ).toBeVisible({ timeout: 45000 });
  await expect(
    page.getByText(
      "A reviewer or a different administrator must review this proposal.",
    ),
  ).toBeVisible();
  const report = await page
    .getByRole("link", { name: "Export audit JSON" })
    .getAttribute("href");
  expect(report).toBeTruthy();
  await expect(
    page.getByRole("heading", { name: "Captured evidence" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 2,
  );
  expect(overflow).toBe(false);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `test-results/investigation-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Evidence before action." }),
  ).toBeVisible();
  await login(page, "reviewer");
  const runId = report!.split("/")[3];
  const run = await page.request.get(`/backend/investigations/${runId}`);
  const caseId = (await run.json()).case_id;
  await page
    .getByRole("button", { name: new RegExp(caseId) })
    .first()
    .click();
  await page
    .getByLabel("Review rationale")
    .fill("Reviewed all captured evidence and deterministic policy controls.");
  await page.getByRole("button", { name: "Approve proposal" }).click();
  await expect(
    page.getByRole("heading", { name: /^approved$/i }),
  ).toBeVisible();
});
