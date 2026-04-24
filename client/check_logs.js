const puppeteer = require('puppeteer');
(async () => {
    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', err => console.log('ERROR:', err.message));
        await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle0' });
        const html = await page.evaluate(() => document.body.innerHTML);
        console.log('HTML CONTENT:', html);
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
})();
