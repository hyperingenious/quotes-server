// const { PdfReader } = require("pdfreader");

// const parsePDF = (filepath) => {
//   console.log(`Starting to parse PDF: ${filepath}`);
//   return new Promise((resolve, reject) => {
//     let textArray = [];
//     new PdfReader().parseFileItems(filepath, (err, item) => {
//       if (err) {
//         console.error("Error parsing PDF:", err);
//         reject(err);
//       } else if (!item) {
//         console.log("PDF parsing completed");
//         console.log(textArray)
//         resolve(textArray.join(''));
//       } else if (item.text) {
//         textArray.push(item.text);
//       }
//     });
//   });
// };

// module.exports = {
//   parsePDF,
// };
const fs = require("fs");
const pdf = require("pdf-parse");

const parsePDF = async (filepath) => {
  const dataBuffer = fs.readFileSync(filepath);
  return pdf(dataBuffer).then((data) => data.text);
};

module.exports = {
  parsePDF,
};
