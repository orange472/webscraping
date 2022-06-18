function stringMatch(string1, string2) {
  return string1.toLowerCase().includes(string2.toLowerCase());
}

function trimText(s) {
  // return s.trim().split(/[\t\n]+/g);
  return s.trim().replace(/[\t\n]+/g, " ").replace(/[" "]+/g, " ");
}

function snakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function camelCase(s) {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
}

function pascalCase(str) {
  var camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

module.exports = {
  stringMatch,
  trimText,
  snakeCase,
  camelCase,
  pascalCase,
};
