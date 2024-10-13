const { PdfReader } = require("pdfreader");

const parsePDF = (filepath) => {
  console.log(`Starting to parse PDF: ${filepath}`);
  return new Promise((resolve, reject) => {
    let text = "";
    new PdfReader().parseFileItems(filepath, (err, item) => {
      if (err) {
        console.error("Error parsing PDF:", err);
        reject(err);
      }
      else if (!item) {
        console.log("PDF parsing completed");
        resolve(text);
      }
      else if (item.text) text += item.text + " ";
    });
  });
};

module.exports = {
  parsePDF,
};
