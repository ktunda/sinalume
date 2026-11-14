const { chromium } = require('playwright');
(async () => {
  const [,, html, pdf, png] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + html); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  if (png) { await p.setViewportSize({width: 900, height: 1200}); await p.screenshot({ path: png, fullPage: true }); }
  await b.close();
})();
