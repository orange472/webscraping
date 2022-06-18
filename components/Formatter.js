const cheerio = require("cheerio");
const fs = require("fs");
const { trimText } = require("../helpers");

function Formatter(tables, target, strategy = 2) {
  var payload = {};

  for (const table of tables) {
    extract(table);
  }

  extract(fs.readFileSync("content/table.html"));

  function extract(table) {
    const $ = cheerio.load(table);
    const rows = $("table").find("tr");
    var curr = ""; // holds the key most recently inserted into payload

    const getFirstNodeText = (element) => {
      // helper function to get text from a only the first level of a node
      return $(element)
        .first()
        .contents()
        .filter(function () {
          return this.type == "text";
        })
        .text();
    };

    const strategy1 = () => {
      rows.each((trIdx, tr) => {
        const cells = $(tr).find("td");

        cells.each((tdIdx, td) => {
          var data = $(td).find("*");

          if (tdIdx == 0) {
            data = data
              .filter((i, e) => {
                return getFirstNodeText(e).length > 0;
              })
              .first();
            data = trimText(data.text().replace(" ", "_"));
            curr = data;
          } else {
            data = data.filter((i, e) => {
              var haystack = getFirstNodeText(e);
              var needle = new RegExp("\\b" + target + "\\b", "i");
              return haystack.match(needle) != null;
            });
            var text = trimText(data.first().next().text());
            if (text.length > 0) payload[curr] = text;
          }
        });
      });
    };

    const strategy2 = () => {
      var targetCol = 1;
      var th = false;

      if (rows.find("th").length > 0) {
        $("th").each((i, th) => {
          let haystack = $(th).text();
          let needle = new RegExp("\\b" + target + "\\b", "i");
          if (haystack.match(needle)) {
            targetCol = i;
          }
        });
        th = true;
      }

      rows.each((trIdx, tr) => {
        const cells = $(tr).find("td");

        if (trIdx == 0) {
          if (th == true) return; // table headers were found, so skip first row

          cells.each((tdIdx, td) => {
            let haystack = $(th).text();
            let needle = new RegExp("\\b" + target + "\\b", "i");
            if (haystack.match(needle)) {
              targetCol = tdIdx;
            }
          });
        } else
          cells.each((tdIdx, td) => {
            var data = $(td).find("*");

            if (tdIdx == 0) {
              data = data
                .filter((i, e) => {
                  return getFirstNodeText(e).length > 0;
                })
                .first();
              data = trimText(data.text().replace(" ", "_"));
              curr = data;
            } else if (tdIdx == targetCol) {
              var text = trimText($(td).text());
              if (text.length > 0) payload[curr] = text;
            }
          });
      });
    };

    switch (strategy) {
      case 1:
        strategy1();
        break;
      case 2:
        strategy2();
        break;
      default:
        break;
    }
  }

  return payload;
}

module.exports = {
  Formatter,
};
