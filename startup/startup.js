const path = require("path");
const fs = require("fs");

function startup() {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, "../uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
}
module.exports = { startup };
