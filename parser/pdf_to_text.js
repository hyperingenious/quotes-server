const fs = require("fs");
const pdf = require("pdf-parse");

const parsePDF = async (filepath) => {
  try {
    const dataBuffer = fs.readFileSync(filepath);
    return pdf(dataBuffer).then((data) => data.text);
  } catch (error) {
    console.error("Problem in parsing text");
    throw error;
  }
};

module.exports = {
  parsePDF,
};
