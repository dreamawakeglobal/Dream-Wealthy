const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`CONSOLE ERROR: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
    console.log(`STACK: ${err.stack}`);
  });
  
  try {
    await page.goto('http://localhost:5173/expenses', { waitUntil: 'networkidle' });
  } catch(e) {
    console.log("Navigation error:", e.message);
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
