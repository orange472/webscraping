const cheerio = require("cheerio");
const fs = require("fs");
const { trimText, askQuestion } = require("../helpers");

async function Formatter(tables, targets, strategy = 0) {
  // initialize storage
  const payload = {};

  for (const [i, table] of tables.entries()) {
    console.log(
      "\x1b[35m%s\x1b[0m",
      `Formatting... [${i + 1}/${tables.length}]`
    );
    var res = await extract(table); // call to extract information from the table
    if (res == "done all") break; // strategy 3 -> if the user enters "done all", then skip the remaining tables
  }

  async function extract(table) {
    const $ = cheerio.load(table); // use cheerio to parse the table
    fs.writeFileSync("content/tables.html", $(table).html()); // log the table's html
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

    function strategy1() {
      rows.each((trIdx, tr) => {
        const cells = $(tr).find("td");

        cells.each((tdIdx, td) => {
          var content = $(td).find("*");

          if (tdIdx == 0) {
            content = content
              .filter((i, e) => {
                return getFirstNodeText(e).length > 0;
              })
              .first();
            curr = trimText(content.text().replace(" ", "_"));
          } else {
            targets.forEach((target) => {
              content = content.filter((i, e) => {
                var haystack = getFirstNodeText(e);
                var needle = new RegExp("\\b" + target + "\\b", "i");
                return haystack.match(needle) != null;
              });
              var text = trimText(content.next().text());
              if (text.length == 0) return;

              if (curr in payload) {
                payload[curr][target] = text;
              } else {
                payload[curr] = {
                  [target]: text,
                };
              }
            });
          }
        });
      });
    }

    function strategy2() {
      var th = false;
      var targetCols = {};

      if (rows.find("th").length > 0) {
        for (const target of targets) {
          $("th").each((i, th) => {
            let haystack = $(th).text();
            let needle = new RegExp("\\b" + target + "\\b", "i");
            if (haystack.match(needle)) {
              targetCols[target] = i;
            }
          });
        }
        th = true;
      }

      rows.each((trIdx, tr) => {
        const cells = $(tr).find("td");

        if (trIdx == 0) {
          if (th == true) return; // table headers were found, so skip first row

          for (const target of targets) {
            cells.each((tdIdx, td) => {
              let haystack = $(td).text();
              let needle = new RegExp("\\b" + target + "\\b", "i");
              if (haystack.match(needle)) {
                targetCols[target] = i;
              }
            });
          }
        } else
          for (const target of targets) {
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
              } else if (tdIdx == targetCols[target]) {
                var text = trimText($(td).text());
                if (text.length == 0) return;

                if (curr in payload) {
                  payload[curr][target] = text;
                } else {
                  payload[curr] = {
                    [target]: text,
                  };
                }
              }
            });
          }
      });
    }

    async function strategy3() {
      var availableProperties = ["name"].concat(targets);
      var selectors = {};
      var depth = 0;
      var className = "";
      var id = "";
      var tag = "";
      var colIdx = 0;
      var index = 0;
      var text = "";

      const printOutRules = () => {
        console.log(
          "\x1b[34m%s\x1b[0m",
          'Type "back" to go to previous text.\n' +
            'Type nothing or "next" to go to next text.\n' +
            'Type "next row" to go the next table row.\n' +
            'Type "prev row" to go to previous table row.\n' +
            "Type a property from the available properties if the text matches the property.\n" +
            'Type "done" to skip table.\n' +
            'Type "done all" to skip all remaining tables.\n'
        );
      };

      // user manually defines where to look for properties
      for (var i = 0; i < rows.toArray().length; i++) {
        const tr = rows.toArray()[i];
        var cells = $(tr).find("td").toArray();
        var breakI = false;

        for (var j = 0; j < cells.length; j++) {
          const td = cells[j];
          var content = $(td).find("*").toArray();
          var breakJ = false;

          for (var k = -1; k < content.length; k++) {
            if (k < -1) {
              i -= 2;
              breakJ = true;
              break;
            }

            const e = content[k];

            colIdx = j;
            if (k == -1) {
              text = trimText($(td).text());
              depth = 0;
              className = $(td).attr("class");
              id = $(td).attr("id");
              tag = $(td)[0].name;
            } else {
              text = trimText($(e).text());
              depth = $(e).parents().length - $(td).parents().length;
              className = $(e).attr("class");
              id = $(e).attr("id");
              tag = $(e)[0].name;
              index = $(e).index();
            }

            console.log("\x1b[33m%s\x1b[0m", "Found text:", text);
            console.log("Available properties:", availableProperties);
            var res = await askQuestion('Type "help" for help.');
            console.log("");

            if (res == "help") {
              printOutRules();
              k--;
            } else if (res == "done all") {
              return "done all";
            } else if (res == "done") {
              return;
            } else if (res == "" || res == "next") {
              continue;
            } else if (res == "back") {
              k -= 2;
            } else if (res == "next row") {
              breakJ = true;
              break;
            } else if (res == "prev row") {
              i -= 2;
              breakJ = true;
              break;
            } else {
              var idx = availableProperties.indexOf(res);
              if (idx == -1) {
                console.log("\x1b[34m%s\x1b[0m", "No such property found!");
                k--;
                continue;
              }

              var prop = availableProperties[idx];
              selectors[prop] = {
                depth: depth,
                className: className,
                id: id,
                tag: tag,
                colIdx: colIdx,
                index: index,
                prev: $(e).prev(),
                next: $(e).next(),
              };

              availableProperties.splice(idx, 1);
              if (availableProperties.length == 0) {
                breakI = true;
                breakJ = true;
                break;
              }
            }
          }
          if (breakJ) break;
        }
        if (breakI) break;
      }

      // at this point, the user should have pointed out where to look for properties
      rows.each((trIdx, tr) => {
        var cells = $(tr).find("td").toArray();
        curr = "";

        for (prop in selectors) {
          const { depth, className, id, tag, colIdx, prev, next } =
            selectors[prop];
          const td = cells[colIdx];
          var text = "";
          var best = td;
          var bestCount = 0;

          if (depth == 0) {
            text = trimText($(td).text());
          } else {
            var content = $(td).find(tag);
            content.each((i, e) => {
              let count = 0;
              count += $(e).attr("class") == className;
              count += $(e).attr("id") == id;
              count += $(e).parents().length - $(td).parents().length == depth;
              count += $(e).prev().text() == $(prev).text();
              count += $(e).next().text() == $(next).text();
              if (count > bestCount) {
                bestCount = count;
                best = e;
              }
            });
            text = trimText($(best).text());
          }

          if (prop == "name") {
            curr = text;
          } else if (text.length > 0 && curr != "") {
            if (curr in payload) {
              payload[curr][prop] = text;
            } else {
              payload[curr] = {
                [prop]: text,
              };
            }
          }
        }
      });
    }

    switch (strategy) {
      case 1:
        strategy1();
        break;
      case 2:
        strategy2();
        break;
      case 3:
        await strategy3();
        break;
      default:
        console.log("Invalid strategy!");
    }
  }

  return payload;
}

module.exports = {
  Formatter,
};
