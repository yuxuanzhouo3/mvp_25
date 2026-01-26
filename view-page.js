const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/exam?step=goal&source=search');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'current-page.png', fullPage: true });
  console.log('Screenshot saved to current-page.png');
  await page.waitForTimeout(30000); // Keep browser open for 30 seconds
  await browser.close();
})();
