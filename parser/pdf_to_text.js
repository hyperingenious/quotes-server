const fs = require("fs");
const pdf = require("pdf-parse");

const parsePDF = async (filepath) => {
  const dataBuffer = fs.readFileSync(filepath);
  return pdf(dataBuffer).then((data) => data.text);
};

module.exports = {
  parsePDF,
};
