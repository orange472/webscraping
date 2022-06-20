const fs = require("fs");
const yaml = require("js-yaml");
const { camelCase, snakeCase, pascalCase } = require("../helpers");

function Writer(payload, tableName, columnNames, columnTargets) {
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
};
