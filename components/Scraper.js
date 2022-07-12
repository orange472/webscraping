const puppeteer = require("puppeteer");
const { askQuestion } = require("../helpers");

async function Scraper(rootURL, name, columns, depth = 0, breadth = 0) {
  // launch puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  // initialize storage
  const visited = new Set();
  const tables = new Array();

  console.log("\x1b[36m%s\x1b[0m", "Table name:", name);

  // entry point
  if (rootURL == null || rootURL == "") {
    await scrapeUserInput();
  } else {
    await scrape(rootURL, 0);
  }

  async function scrapeUserInput() {
    // ask for search query to enter into Google
    var query = await askQuestion(
      "Enter a search term (or type nothing if you want to enter a full url): "
    );

    if (query == "") {
      // if user enters nothing, then the program expects a full url next
      var res = await askQuestion(
        'Enter url (or type "back" to enter a search term): '
      );
      if (res == "back") return scrapeUserInput(); // start over
      await scrape(res);
    } else {
      console.log("\x1b[35m%s\x1b[0m", "Searching...");

      // search Google using search query provided
      let urls = await search(query);
      let res = await askQuestion(
        'Enter how many links to scrape (or type "show" to show links or "back" to enter a new search term): '
      );

      // keep on asking question until user does NOT enter "show" (i.g. a number or "back")
      while (res == "show" || res == "links") {
        for (var i = 0; i < urls.length; i++) {
          console.log("\x1b[32m%s\x1b[0m", i + 1 + ")", urls[i]);
        }
        res = await askQuestion(
          'Enter how many links you would like to scrape (or type "show" to show links or "back" to enter a new search term): '
        );
      }

      if (res == "back") return scrapeUserInput(); // start over
      if (res[0] == "[") {
        res = res.replace(/\[|\]/g, "").split(","); // convert res from a string to an array of integers
        for (var i = 0; i < res.length; i++) {
          let idx = parseInt(res[i]);
          if (idx == NaN) continue; // idx is not a number

          await scrape(urls[idx - 1]); // subtracting 1 expecting that the user entered indexes according to 1-based array
        }
        return; // scrape the urls chosen by the user and don't do more (hence the return statement)
      }

      if (parseInt(res) == NaN) res = 1; // res defaults to 1
      if (res > 0) console.log("\x1b[35m%s\x1b[0m", "Scraping...");
      for (var i = 0; i < parseInt(res); i++) {
        await scrape(urls[i]); // scrape urls starting from beginning of list until index is = to res
      }
    }
  }

  async function search(query) {
    try {
      var q = query.replace(/[ +]/, "+"); // replace spaces with "+" because Google's search url is formatted using "+"s
      await page.goto(`https://www.google.com/search?q=${q}`);
      await page.screenshot({ path: "screenshots/searchresults.png" }); // take a screenshot of the search results
    } catch (err) {
      console.log(err);
      return;
    }

    // get the hrefs of the a tags inside #res (the id associated with the search results div)
    const res = await page.$$eval(
      "shadow/#res > #search a[href]",
      function (links) {
        return links
          .filter((e) => {
            return e.getAttribute("href").substring(0, 5).includes("http");
          })
          .map((e) => {
            return e.getAttribute("href");
          });
      }
    );

    return res;
  }

  async function scrape(url, n = 0) {
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
      (tables, columns) => {
        return tables
          .filter((e) => {
            return columns.some((col) => {
              return e.outerHTML.toLowerCase().includes(col.toLowerCase());
            });
          })
          .map((e) => {
            return e.outerHTML;
          });
      },
      columns
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
      else await scrape(link, n + 1);
    }
  }

  // close puppeteer
  await browser.close();

  // return data as an array
  return tables;
}

module.exports = {
  Scraper,
};
