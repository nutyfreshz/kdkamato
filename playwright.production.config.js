const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir:'./tests',
  testMatch:/production-ui-qa\.spec\.js/,
  timeout:30000,
  expect:{ timeout:7000 },
  workers:1,
  retries:0,
  reporter:[['list'],['json',{outputFile:'test-results/production-results.json'}]],
  use:{
    baseURL:'https://kdkamato.vercel.app',
    browserName:'chromium',
    headless:true,
    trace:'retain-on-failure',
  },
});
