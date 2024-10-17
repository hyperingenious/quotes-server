require('dotenv').config();
const express = require("express");
const cors = require('cors');
const { upload_pdf_route } = require("./routes/upload");
const { startup } = require("./startup/startup");
const app = express();
const PORT = process.env.PORT || 3000;

startup();

const allowedOrigins = [
  "https://getsomequotes.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.post("/upload", upload_pdf_route);

app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

app.listen(PORT, () => {
    console.log(`Serve is running on http://localhost:${PORT}`);
});
