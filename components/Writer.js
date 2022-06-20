const fs = require("fs");
const yaml = require("js-yaml");
const { camelCase, snakeCase, pascalCase } = require("../helpers");

function Writer(payload, name, columns, target) {
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

function WriterMultiple(payload, tableName, columnNames, columnTargets) {
  // payload is in the form {name: {description: }}
  var output = {};
  output.name = tableName;
  output.columns = [];

  for (const [i, colName] of columnNames.entries()) {
    output.columns[i] = {
      name: colName,
    };
    for (const colTarget of columnTargets) {
      if (colName in payload) {
        output.columns[i][colTarget] = payload[colName][colTarget];
      } else if (camelCase(colName) in payload) {
        output.columns[i][colTarget] = payload[camelCase(colName)][colTarget];
      } else if (snakeCase(colName) in payload) {
        output.columns[i][colTarget] = payload[snakeCase(colName)][colTarget];
      } else if (pascalCase(colName) in payload) {
        output.columns[i][colTarget] = payload[pascalCase(colName)][colTarget];
      } else {
        output.columns[i][colTarget] = colTarget + " not found.";
      }
    }
  }

  fs.appendFileSync("content/output.yml", yaml.dump(output));
}

module.exports = {
  Writer,
  WriterMultiple
};
