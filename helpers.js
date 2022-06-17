function stringMatch(string1, string2) {
    return string1.toLowerCase().includes(string2.toLowerCase());
}

function trimText(s) {
    // return s.trim().split(/[\t\n]+/g);
    return s.trim().replace(/[\t\n]+/g, " ");
}

module.exports = {
    stringMatch,
    trimText,
};
