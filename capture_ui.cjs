const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Launching browser...");
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        console.log("Loading dashboard...");
        // Desktop screenshot
        await page.setViewport({ width: 1440, height: 900 });
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        // Force dark mode and wait for charts to animate
        await page.evaluate(async () => {
            // Apply dark mode theme if user component supports it, or force attribute
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            
            // Hide scrollbars for cleaner screenshot
            const style = document.createElement('style');
            style.innerHTML = '::-webkit-scrollbar { display: none; }';
            document.head.appendChild(style);
            
            // Wait 3 seconds for initial animations
            await new Promise(resolve => setTimeout(resolve, 3000));
        });
        
        console.log("Capturing desktop UI...");
        await page.screenshot({ path: '/tmp/desktop_ui.png', fullPage: false });
        
        console.log("Switching to mobile viewport...");
        // Mobile screenshot
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        
        // Let it recalculate layout
        await page.evaluate(async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
        });
        
        console.log("Capturing mobile UI...");
        await page.screenshot({ path: '/tmp/mobile_ui.png', fullPage: false });
        
        console.log("Success! Close browser.");
        await browser.close();
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
})();
