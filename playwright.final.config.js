const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /final-ui-qa\.spec\.js/,
  timeout: 30000,
  expect: { timeout: 7000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start -- -p 3000',
    url: 'http://127.0.0.1:3000',
    timeout: 120000,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
