const fs = require("fs");
const yaml = require("js-yaml");
const { camelCase, snakeCase, pascalCase } = require("../helpers");

function Writer(payload, columns, name, target) {
  var output = {};
  output.name = name;
  output.columns = [];

  for (const col of columns) {
    if (camelCase(col) in payload) {
      output.columns.push({
        name: col,
        [target]: payload[camelCase(col)],
      });
    } else if (snakeCase(col) in payload) {
      output.columns.push({
        name: col,
        [target]: payload[snakeCase(col)],
      });
    } else if (pascalCase(col) in payload) {
      output.columns.push({
        name: col,
        [target]: payload[pascalCase(col)],
      });
    } else {
      output.columns.push({
        name: col,
        [target]: "No description found.",
      });
    }
  }

  fs.appendFileSync("content/output.yml", yaml.dump(output));
}

module.exports = {
  Writer,
};
