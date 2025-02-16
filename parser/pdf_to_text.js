const fs = require("fs");
const mammoth = require("mammoth");
const pdf = require("pdf-parse");
const { parseEpub } = require('@gxl/epub-parser');
const htmlToText = require("html-to-text");


const parseEPUB = async (filepath) => {
  const epubObj = await parseEpub(filepath, { type: "path" });

  // Get all EPUB text content
  const chapters = epubObj.sections || [];

  const extractedText = chapters
    .map((ch) => htmlToText.convert(ch.htmlString)) // Convert HTML to plain text
    .join("\n\n");

  return extractedText;
};

const parsePDF = async (filepath) => {
  try {
    const dataBuffer = fs.readFileSync(filepath);
    return pdf(dataBuffer).then((data) => data.text);
  } catch (error) {
    console.error("Problem in parsing PDF");
    throw error;
  }
};

async function parseDOC(filepath) {
  const buffer = fs.readFileSync(filepath);
  const { value: text } = await mammoth.extractRawText({ buffer });
  return text;
};

async function parseTXT(filepath) {
  const text = fs.readFileSync(filepath, "utf8");
  console.log(text)
  return text
}

module.exports = {
  parsePDF,
  parseDOC,
  parseEPUB,
  parseTXT
};