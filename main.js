const { performance } = require("perf_hooks");
const fs = require("fs");
const yaml = require("js-yaml");
const puppeteer = require("puppeteer");
const { QueryHandler } = require("query-selector-shadow-dom/plugins/puppeteer");
const { Scraper } = require("./components/Scraper");
const { Formatter } = require("./components/Formatter");
const { Writer } = require("./components/Writer");

(async function main() {
  const startTime = performance.now();

  const url = null; // optional, not recommended unless data is all on one webpage
  const tableNames = []; // pulled from yml file
  const columnNames = []; // pulled from yml file
  const target = "description"; // ** manually required **

  pullTablesAndColumns(); // ** needs to be manually written because yml files aren't written the same **

  function pullTablesAndColumns() {
    const doc = yaml.load(fs.readFileSync("./components/input.yml"));
    // console.log(doc);

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

  for (const [i, name] of tableNames.entries()) {
    const columns = columnNames[i];
    const tables = await Scraper(url, name, columns, 0, 0);
    const payload = await Formatter(tables, target);
    console.log(payload);
    await Writer(payload, columns, name, target);
  }

  const endTime = performance.now();
  const elapsed = ((endTime - startTime) / 1000).toFixed(3);
  console.log("\x1b[32m%s\x1b[0m", `Done in ${elapsed} seconds!`);
})();
