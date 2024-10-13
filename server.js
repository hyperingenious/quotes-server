require('dotenv').config();
const express = require("express");
const { upload_pdf_route } = require("./routes/upload");
const { startup } = require("./startup/startup");
const app = express();
const PORT = process.env.PORT || 3000;

startup();

app.post("/upload", upload_pdf_route);

app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

app.listen(PORT, () => {
    console.log(`Serve is running on http://localhost:${PORT}`);
});
