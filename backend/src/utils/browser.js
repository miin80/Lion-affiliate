import puppeteer from 'puppeteer';

let browserPromise = null;

/** Singleton browser instance — tránh boot Chromium nhiều lần. */
export async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--lang=vi-VN,vi',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
  }
  return browserPromise;
}

/** Mở 1 page mới với UA & viewport mobile-ish (đa số site trả về data tốt hơn). */
export async function newPage() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36'
  );
  await page.setViewport({ width: 412, height: 915, isMobile: true, deviceScaleFactor: 2 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8' });
  // Block tracker / analytics / fonts để tăng tốc
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const t = req.resourceType();
    if (['font', 'media', 'stylesheet'].includes(t)) return req.abort();
    req.continue();
  });
  return page;
}

export async function withPage(fn) {
  const page = await newPage();
  try {
    return await fn(page);
  } finally {
    await page.close().catch(() => {});
  }
}
