const cheerio = require("cheerio");
const { trimText } = require("../helpers");

function Formatter(tables, target) {
  var payload = {};
  // var tables = JSON.parse(fs.readFileSync("./content/tables.json"));

  for (const table of tables) extract(table);

  function extract(table) {
    var curr = ""; // holds the key most recently inserted into payload

    // helper function to get text from a node excluding its children
    function getFirstNodeText(element) {
      return $(element)
        .first()
        .contents()
        .filter(function () {
          return this.type == "text";
        })
        .text();
    }

    const $ = cheerio.load(table);
    const rows = $("table").find("tr");

    rows.each((trIdx, tr) => {
      const cells = $(tr).find("td");

      cells.each((tdIdx, td) => {
        var data = $(td).find("*");

        if (tdIdx == 0) {
          // replacing data with itself for no other reason other than syntactical sugar
          data = data.filter((i, e) => {
            return getFirstNodeText(e).length > 0;
          });
          data = trimText(data.text().replace(" ", "_"));
          curr = data;
          if (!(curr in payload)) payload[curr] = null; // insert key
        } else {
          data = data.filter((i, e) => {
            var haystack = getFirstNodeText(e);
            var needle = new RegExp("\\b" + target + "\\b", "i");
            return haystack.match(needle) != null;
          });
          data.each((i, e) => {
            var text = trimText($(e).next().text());
            if (text.length > 0) payload[curr] = text;
          });
        }
      });
    });
  }

  return payload;
}

module.exports = {
  Formatter,
};
