require('dotenv').config();
const express = require("express");
const { upload_pdf_route } = require("./routes/upload");
const { startup } = require("./startup/startup");
const app = express();
const PORT = process.env.PORT || 3000;

startup();

app.post("/upload", upload_pdf_route);

// Start the server
app.listen(PORT, () => {
    console.log(`Serve is running on http://localhost:${PORT}`);
});
