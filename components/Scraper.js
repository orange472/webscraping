const puppeteer = require("puppeteer");
const { QueryHandler } = require("query-selector-shadow-dom/plugins/puppeteer");

async function Scraper(rootURL, name, depth = 0, breadth = 0) {
  // launch puppeteer
  await puppeteer.registerCustomQueryHandler("shadow", QueryHandler);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  // initialize storage
  const visited = new Set();
  const tables = new Array();

  await (async function scrape(url = rootURL, n = 0) {
    // if maximum depth is reached, return
    if (n > depth) return;

    // if url already has already been scraped, return
    if (visited.has(url)) return;
    else visited.add(url);

    // cout current depth and url
    console.log("DEPTH:", n, "|", "URL:", url);

    // load page/url
    try {
      await page.goto(url, { waitUntil: "networkidle2" });
      await page.screenshot({ path: "screenshots/screenshot.png" });
    } catch (err) {
      return;
    }

    // scrape tables
    const filteredTables = await page.$$eval(
      "shadow/table",
      (tables, name) => {
        return tables
          .filter((e) => {
            return e.outerHTML.toLowerCase().includes(name.toLowerCase());
          })
          .map((e) => {
            return e.outerHTML;
          });
      },
      name
    );

    // store tables
    tables.push(...filteredTables);

    // scrape links
    const filteredLinks = await page.$$eval(
      "shadow/a[href]",
      (links, url, name) => {
        return links
          .filter((e) => {
            return e.outerHTML.toLowerCase().includes(name.toLowerCase());
          })
          .map((e) => {
            var href = e.getAttribute("href");
            if (!href.includes("http")) {
              href = url + "/" + href;
            }
            return href;
          });
      },
      url,
      name
    );

    // explore links
    for (const [i, link] of filteredLinks.entries()) {
      if (i >= breadth) break;
      else await scrape(link, name, n + 1);
    }
  })();

  // close puppeteer
  await browser.close();

  // return data as an array
  return tables;
}

module.exports = {
  Scraper,
};
