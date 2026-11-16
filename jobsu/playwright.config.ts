import { defineConfig } from "@playwright/test";

const PORT = 3200;
const DATABASE_URL = process.env.TEST_DATABASE_URL || "postgres://jobsu:jobsu@localhost:5432/jobsu_test";
process.env.TEST_DATABASE_URL = DATABASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/log-in`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL,
      APP_URL: `http://localhost:${PORT}`,
      STUDENT_EMAIL_DOMAINS: "bc.edu",
      ADMIN_EMAILS: "admin@jobsu.test",
      PAYMENTS_PROVIDER: "mock",
      CRON_SECRET: "test-cron-secret",
      DEV_SHOW_CODES: "true",
      RESEND_API_KEY: "",
    },
  },
});
