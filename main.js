const { performance } = require("perf_hooks");
const fs = require("fs");
const yaml = require("js-yaml");
const puppeteer = require("puppeteer");
const { QueryHandler } = require("query-selector-shadow-dom/plugins/puppeteer");
const { Scraper } = require("./components/Scraper");
const { Formatter } = require("./components/Formatter");
const { Writer, WriterMultiple } = require("./components/Writer");

(async function main() {
  const startTime = performance.now();

  var url = null; // optional, scraper will only scrape the url entered
  var depth = 0;
  var breadth = 0;
  var source = ""; // pulled from yml file
  const tableNames = []; // pulled from yml file
  const columnNames = []; // pulled from yml file

  const targets = ["description"]; // ** manually required **
  var strategy = 3;

  pullData(); // ** manually required **

  function pullData() {
    const doc = yaml.load(fs.readFileSync("./content/input.yml"));
    // console.log(doc);

    source = doc.sources[0].name;
    const tables = doc.sources[0].tables;

    for (var i = 0; i < tables.length; i++) {
      tableNames.push(tables[i].name);

      var column = [];

      var data = tables[i].columns;
      for (const x of data) {
        column.push(x.name);
      }
      columnNames.push(column);
    }
  }

  await puppeteer.registerCustomQueryHandler("shadow", QueryHandler);
  fs.writeFileSync("content/output.yml", "", (err) => {});

  console.log("\x1b[36m%s\x1b[0m", "Source name:", source);
  
  for (const [i, name] of tableNames.entries()) {
    const columns = columnNames[i];
    const tables = await Scraper(url, name, columns, depth, breadth);
    const payload = await Formatter(tables, targets, strategy);
    await Writer(payload, name, columns, targets);
  }

  const endTime = performance.now();
  const elapsed = ((endTime - startTime) / 1000).toFixed(3);
  console.log("\x1b[32m%s\x1b[0m", `Done in ${elapsed} seconds!`);
})();
