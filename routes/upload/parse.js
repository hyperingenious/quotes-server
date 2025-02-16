const { parseEPUB, parsePDF, parseDOC } = require("../../parser/pdf_to_text");

async function parse({ filepath, mimetype }) {
    let text;
    if (mimetype === 'application/pdf')
        text = await parsePDF(filepath);

    if (mimetype === 'application/epub+zip' || mimetype === 'application/x-epub')
        text = await parseEPUB(filepath);

    if (mimetype === 'text/plain')
        text = await parseTXT(filepath);

    if (mimetype === 'application/msword' ||
        mimetype === 'application/doc' ||
        mimetype === 'application/x-msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/x-docx')
        text = await parseDOC(filepath);

    return text
}

module.exports = parse;