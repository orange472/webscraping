const { performance } = require("perf_hooks");
const fs = require("fs");
const { Scraper } = require("./components/Scraper");
const { Formatter } = require("./components/Formatter");
const { Writer } = require("./components/Writer");

(async function main() {
  const startTime = performance.now();

  var url =
    "https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_account.htm";
  var name = "account";
  var columns = ["account_number", "account_source"];
  var target = "description";

  const tables = await Scraper(url, name, 0, 0);
  const payload = await Formatter(tables, columns, target);
  console.log(payload);

  const endTime = performance.now();
  const elapsed = ((endTime - startTime) / 1000).toFixed(3);

  console.log("\x1b[32m%s\x1b[0m", `Done in ${elapsed} seconds!`);
})();
