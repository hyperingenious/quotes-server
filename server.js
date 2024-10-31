require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { upload_pdf_route } = require("./routes/upload");
const { startup } = require("./startup/startup");
const { generateContent } = require("./routes/generate_content");
const { deleteContent } = require("./routes/delete_content");
const app = express();
const PORT = process.env.PORT || 3000;

startup();

const allowedOrigins = [
  "http://localhost:5173",
  "https://purplenight.vercel.app",
  "https://purplenight.hyperingenious.tech",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

app.post("/upload", upload_pdf_route);
app.post("/generate-content", generateContent);
app.post("/delete-content", deleteContent);

app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

app.listen(PORT, () => {
  console.log(`Serve is running on http://localhost:${PORT}`);
});
