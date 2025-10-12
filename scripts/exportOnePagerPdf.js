// Minimal HTML -> PDF export using Puppeteer
// Usage: node scripts/exportOnePagerPdf.js [inputHtmlPath] [outputPdfPath]

const path = require('path');

(async () => {
  const input = process.argv[2] || path.resolve(__dirname, '..', 'docs', 'google-ads-api-one-pager.html');
  const output = process.argv[3] || path.resolve(__dirname, '..', 'docs', 'google-ads-api-one-pager.pdf');

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.error('Puppeteer is not installed. Run: npm i -D puppeteer');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    const url = 'file://' + input.replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    console.log('PDF created:', output);
  } finally {
    await browser.close();
  }
})();
