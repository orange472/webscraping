const puppeteer = require("puppeteer");
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});
const { performance } = require("perf_hooks");
const fs = require("fs");

async function main() {
    var startTime = performance.now();

    await scrape(
        "https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/big_object.htm"
        // [".tile-label sidebar-item-truncate-text"]
    );

    var endTime = performance.now();
    var done = ((endTime - startTime) / 1000).toFixed(3);

    console.log("\x1b[32m%s\x1b[0m", `Done in ${done} seconds!`);
}

async function scrape(url = "", selectors = []) {
    // make sure that a url is inputted
    while (url == "" || url == null) {
        readline.question("Enter url:", (_url) => {
            url = _url;
        });
    }

    // launch puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // load page/url
    try {
        await page.goto(url, { waitUntil: "networkidle2" });
        await page.screenshot({ path: "beforeSelectors.png" });
        for (const s of selectors) {
            await page.waitForSelector(s);
        }
        await page.screenshot({ path: "afterSelectors.png" });
    } catch (error) {
        console.log(error);
    }

    const hrefs = await page.evaluate(() => {
        const walk = (root) => [
            ...[...root.querySelectorAll("a[href]")].map((e) =>
                e.getAttribute("href")
            ),
            ...[...root.querySelectorAll("*")]
                .filter((e) => e.shadowRoot)
                .flatMap((e) => walk(e.shadowRoot)),
        ];
        return walk(document);
    });

    try {
        fs.writeFile("./links", hrefs.toString(), (err) => {
            if (err) throw "Failed to copy links.";
        });
    } catch (error) {
        console.log(error);
    }

    // scrape raw content
    const content = await page.content();
    fs.writeFile("./content", content, (err) => {
        if (err) console.log("Failed to copy HTML content.");
    });

    // close puppeteer
    await browser.close();
}

main();
